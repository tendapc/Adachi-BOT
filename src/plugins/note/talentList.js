import lodash from "lodash";
import { getInfo } from "#utils/api";
import db from "#utils/database";
import { getAvatarDetailPromise } from "./noteDetail.js";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function doAvatarDetail(uid, server, avatar, msg) {
  let skillres = await getAvatarDetailPromise(uid, server, avatar.id, msg.uid, msg.bot);
  let skill = {};
  if (skillres && skillres.skill_list) {
    skill.id = avatar.id;
    let skill_list = lodash.orderBy(skillres.skill_list, ["id"], ["asc"]);
    for (let val of skill_list) {
      val.level_original = val.level_current;
      if (val.name.includes("普通攻击")) {
        skill.a = val;
        continue;
      }
      if (val.max_level >= 10 && !skill.e) {
        skill.e = val;
        continue;
      }
      if (val.max_level >= 10 && !skill.q) {
        skill.q = val;
        continue;
      }
    }
    if (avatar.actived_constellation_num >= 3) {
      const info = await getInfo(avatar.name);
      if (info && info.constellations.length >= 5) {
        if (info.constellations[2].includes("元素战技")) {
          skill.e.level_current += 3;
        } else if (info.constellations[2].includes("元素爆发")) {
          skill.q.level_current += 3;
        }
        if (avatar.actived_constellation_num >= 5) {
          if (info.constellations[4].includes("元素战技")) {
            skill.e.level_current += 3;
          } else if (info.constellations[4].includes("元素爆发")) {
            skill.q.level_current += 3;
          }
        }
      }
    }
  }
  return skill;
}
async function doTalentList(msg, uid, region) {
  const nowTime = new Date().valueOf() / 1000;
  let value = db.get("talent", "user", { uid });
  if (!value || nowTime - value.time > 6 * 60 * 60) {
    value = {};
    value.time = nowTime;
    const data = db.get("info", "user", { uid });
    if (!data) return "请先获取角色信息";
    value.nickname = data.nickname;
    value.uid = data.uid;
    let avatars = [];
    let fives = [];
    let others = [];
    for (var i = 0; i < data.avatars.length; i++) {
      var avatar = data.avatars[i];
      var c = {};
      c.id = avatar.id;
      c.icon = avatar.icon;
      c.name = avatar.name;
      c.element = avatar.element;
      c.fetter = avatar.fetter;
      c.rarity = avatar.rarity;
      c.level = avatar.level;
      c.actived_constellation_num = avatar.actived_constellation_num;
      c.weapon = avatar.weapon;
      c.costumes = avatar.costumes;
      c.skills = await doAvatarDetail(uid, region, avatar, msg);
      if (avatar.rarity === 5) {
        if (avatar.id == 10000007 /*荧*/ || avatar.id == 10000005 /*空*/) avatars[avatars.length] = c;
        else fives[fives.length] = c;
      } else {
        others[others.length] = c;
      }
      if (i % 10 == 9) {
        sleep(100);
      }
    }
    for (var i = 0; i < fives.length; i++) {
      avatars[avatars.length] = fives[i];
    }
    for (var i = 0; i < others.length; i++) {
      avatars[avatars.length] = others[i];
    }
    value.avatars = avatars;
    db.update("talent", "user", { uid }, value);
  }

  const qqid = "" === args ? msg.uid : msg.text.includes("[CQ:at") ? parseInt(msg.text.match(/\d+/g)[0]) : undefined;

  if (undefined !== qqid) {
    value.qqid = qqid;
  }
  msg.bot.logger.debug(`talent:${JSON.stringify(fiveStar)}`);
  render(msg, value, "genshin-talent");
  return undefined;
}

export { doTalentList };
