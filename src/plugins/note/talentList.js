import lodash from "lodash";
import { getInfo } from "#utils/api";
import db from "#utils/database";
import { render } from "#utils/render";
import { getAvatarDetailPromise } from "./noteDetail.js";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function doAvatarDetail(uid, server, avatar, msg) {
  let skillres = await getAvatarDetailPromise(uid, server, avatar.id, msg.uid, msg.bot);
  let skill = {};
  const skill_lvl = "0,1,1,1,2,2,3,3,3,4,5".split(",");
  if (skillres && skillres.skill_list) {
    skill.id = avatar.id;
    let skill_list = lodash.orderBy(skillres.skill_list, ["id"], ["asc"]);
    for (let val of skill_list) {
      val.level_original = val.level_current;
      if (val.name.includes("普通攻击")) {
        skill.a = val;
        skill.a_lvl = skill_lvl[skill.a.level_current];
        continue;
      }
      if (val.max_level >= 10 && !skill.e) {
        skill.e = val;
        skill.e_lvl = skill_lvl[skill.e.level_current];
        skill.e_plus = false;
        continue;
      }
      if (val.max_level >= 10 && !skill.q) {
        skill.q = val;
        skill.q_lvl = skill_lvl[skill.q.level_current];
        skill.q_plus = false;
        continue;
      }
    }
    if (avatar.actived_constellation_num >= 3) {
      const info = await getInfo(avatar.name);
      //msg.bot.logger.debug(`avatar:${JSON.stringify(info)}`);
      if (info && info.constellations.length >= 5) {
        if (info.constellations[2].includes("元素战技")) {
          skill.e.level_current += 3;
          skill.e_plus = true;
        } else if (info.constellations[2].includes("元素爆发")) {
          skill.q.level_current += 3;
          skill.q_plus = true;
        }
        if (avatar.actived_constellation_num >= 5) {
          if (info.constellations[4].includes("元素战技")) {
            skill.e.level_current += 3;
            skill.e_plus = true;
          } else if (info.constellations[4].includes("元素爆发")) {
            skill.q.level_current += 3;
            skill.q_plus = true;
          }
        }
      }
    }
  }
  return skill;
}
async function doTalentList(msg, uid, region, args) {
  const nowTime = new Date().valueOf() / 1000;
  let value = db.get("talent", "user", { uid });
  const data = db.get("info", "user", { uid });
  if (!data || !data.avatars) return "请先获取角色信息";
  if (!value || !value.avatars || nowTime - value.time > 30 * 60 || data.avatars.length > value.avatars.length) {
    msg.bot.say(msg.sid, "正在获取技能数据，请稍等……", msg.type, msg.uid, true);
    value = {};
    value.time = nowTime;
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
      c.constellationNum = avatar.constellationNum;
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
    if (value.avatars.length > 0) db.update("talent", "user", { uid }, value);
    else return "请先获取角色信息";
  }

  let talent = {};
  talent.nickname = value.nickname;
  talent.uid = value.uid;
  talent.avatars = [];
  if (msg.text.includes("五星")) {
    for (var i = 0; i < value.avatars.length; i++) {
      if (value.avatars[i].rarity >= 5) talent.avatars[talent.avatars.length] = value.avatars[i];
    }
  } else if (msg.text.includes("四星")) {
    for (var i = 0; i < value.avatars.length; i++) {
      if (value.avatars[i].rarity == 4) talent.avatars[talent.avatars.length] = value.avatars[i];
    }
  } else {
    talent = value;
  }
  const qqid = "" === args ? msg.uid : msg.text.includes("[CQ:at") ? parseInt(msg.text.match(/\d+/g)[0]) : undefined;

  if (undefined !== qqid) {
    talent.qqid = qqid;
  }
  //msg.bot.logger.debug(`talent:${JSON.stringify(talent)}`);
  render(msg, talent, "genshin-talent");
  return undefined;
}

export { doTalentList };
