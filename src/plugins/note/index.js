import format from "date-format";
import fs from "fs";
import { hasEntrance } from "../../utils/config.js";
import { getID } from "../../utils/id.js";
import { render } from "../../utils/render.js";
import { doTalentList } from "#plugins/note/talentList";
import db from "#utils/database";
import { baseDetail, characterDetail, indexDetail } from "#utils/detail";
import { filterWordsByRegex } from "#utils/tools";
import {
  changeAuto,
  doGetMYB,
  doSign,
  getMYBCookie,
  getUserCookie,
  isAuto,
  ledgerPromise,
  mybCookiePromise,
  notePromise,
  resignInPromise,
  resignInfoPromise,
  rewardsPromise,
  setCacheTimeout,
  setMYBCookie,
  setUserCookie,
  signInfoPromise,
} from "./noteDetail.js";

async function doReSign(msg, uid, region) {
  let signInfo = await signInfoPromise(uid, region, msg.uid, msg.bot);
  if (!signInfo.is_sign) {
    return `今日还未签到`;
  }
  if (signInfo.sign_cnt_missed == 0) return `本月不需要补签`;
  let resignInfo = await resignInfoPromise(uid, region, msg.uid, msg.bot);
  if (resignInfo.coin_cnt < resignInfo.coin_cost)
    return `补签需要${resignInfo.coin_cost}米游币，当前只有${resignInfo.coin_cnt}米游币`;
  if (resignInfo.resign_cnt_monthly >= resignInfo.resign_limit_monthly) return `本月补签次数已用完`;
  if (resignInfo.resign_cnt_daily >= resignInfo.resign_limit_daily) return `今日补签次数已用完`;
  let sign = await resignInPromise(uid, region, msg.uid, msg.bot);
  let data = await rewardsPromise(uid, region, msg.uid, msg.bot);
  return `
${data.month}月累计签到：${signInfo.total_sign_day + 1}天
补签奖励：${data.awards[signInfo.total_sign_day].name} * ${data.awards[signInfo.total_sign_day].cnt}${
    resignInfo.sign_cnt_missed - 1 > 0
      ? `
本月漏签${resignInfo.sign_cnt_missed - 1}天`
      : ``
  }
本月剩余补签次数${resignInfo.resign_limit_monthly - resignInfo.resign_cnt_monthly - 1}`;
}

async function doLedger(msg, uid, region) {
  let data = await ledgerPromise(uid, region, msg.uid, msg.bot);
  if (hasEntrance(msg.text, "note", "lastledger"))
    data = await ledgerPromise(uid, region, msg.uid, msg.bot, data.data_month == 1 ? 12 : data.data_month - 1);
  else if (hasEntrance(msg.text, "note", "lastlastledger"))
    data = await ledgerPromise(
      uid,
      region,
      msg.uid,
      msg.bot,
      data.data_month > 2 ? data.data_month - 2 : 10 + data.data_month
    );
  if (hasEntrance(msg.text, "note", "ledger"))
    return `
旅行者${data.data_month}月札记
当月共获取：
原石：${data.month_data.current_primogems}
摩拉：${data.month_data.current_mora}
旅行者今日已获取${data.day_data.current_primogems}原石，${data.day_data.current_mora}摩拉，明天也要好好努力哦？`;
  else
    return `
旅行者${data.data_month}月札记
当月共获取：
原石：${data.month_data.current_primogems}
摩拉：${data.month_data.current_mora}
原石收入${
      data.month_data.primogems_rate == 0
        ? "跟上个月差不多"
        : `比上个月${
            data.month_data.primogems_rate > 0
              ? `增加${data.month_data.primogems_rate}`
              : `减少${-data.month_data.primogems_rate}`
          }%`
    },
摩拉收入${
      data.month_data.mora_rate == 0
        ? "跟上个月差不多"
        : `比上个月${
            data.month_data.mora_rate > 0 ? `增加${data.month_data.mora_rate}` : `减少${-data.month_data.mora_rate}`
          }%`
    }。`;
}
function getDayTime(nowTime, offset) {
  const newTime = new Date(parseInt(nowTime.valueOf() + offset * 1000));
  return `${nowTime.getDate() != newTime.getDate() ? "明天" : "今天"}${format("hh:mm:ss", newTime)}`;
}
function getDay(nowTime, offset) {
  const newTime = new Date(parseInt(nowTime.valueOf() + offset * 1000));
  return newTime.getMonth() + 1 + "月" + newTime.getDate() + "日";
}
function initCss(width, height, left, top, size = 16, color = "#7b8386") {
  return { width, height, left, top, size, color };
}
async function doPicNote(msg, uid, region) {
  const noteInfo = await notePromise(uid, region, msg.uid, msg.bot);
  const note = noteInfo[1];
  const baseTime = noteInfo[0];
  let bg = undefined;
  let items = [];
  try {
    const bgPath = process.cwd() + "/src/views/component/note/";
    let bgs = [];
    let filesArr = fs.readdirSync(bgPath, { encoding: "utf8", withFileTypes: true });
    filesArr.forEach((item) => {
      if (
        (item.name.endsWith(".png") || item.name.endsWith(".jpg")) &&
        item.name != "crown.png" &&
        item.name != "hart.png"
      ) {
        bgs.push(item.name);
      }
    });
    bg = "component/note/" + bgs[Math.floor(Math.random() * bgs.length)];
    const myDate = new Date();
    let uidAtime = {};
    uidAtime.css = initCss(250, 100, 234, 64, 22);
    uidAtime.text = uid + "<br/>" + getDay(myDate, 0) + "<br/>" + format("hh:mm:ss", myDate);
    items.push(uidAtime);
    let drrt = {};
    drrt.css = initCss(258, 26, 180, 157, 16);
    let dresin = {};
    dresin.css = initCss(200, 26, 200, 200, 30);
    let drrt_next = {};
    drrt_next.css = initCss(300, 26, 200, 236, 16);
    const rrt = parseInt(note.resin_recovery_time);
    const rrd = note.remain_resin_discount_num;
    if (rrt <= 0) {
      drrt.text = "树脂已回满";
      dresin.text = "160/160";
      drrt_next.text = "";
    } else {
      drrt.text = "树脂将在 " + getDayTime(myDate, rrt) + " 回满";
      let r_n = parseInt((76800 - rrt) / 60 / 8);
      dresin.text = parseInt((76800 - rrt) / 60 / 8) + "/160";
      let next = parseInt(r_n / 40 + 1) * 40;
      if (rrd != 0 && r_n < 30) {
        next = 30;
      } else if (r_n < 40) {
        next = 40;
      } else if (r_n < 60) {
        next = 60;
      }
      if (next < 160) drrt_next.text = "将在" + getDayTime(myDate, rrt + next * 8 * 60 - 76800) + "回复至" + next;
    }
    items.push(drrt);
    items.push(dresin);
    items.push(drrt_next);
    let dtf = {};
    dtf.css = initCss(300, 26, 200, 427, 30);
    let dtfrt = {};
    dtfrt.css = initCss(300, 26, 200, 468, 16);
    if (note.transformer != null && note.transformer.obtained) {
      if (note.transformer.recovery_time.reached) {
        dtf.text = "可使用";
      } else {
        var t = "冷却时间：";
        var tfrt = 0;
        var tfrtt = 0;
        if (note.transformer.recovery_time.Day > 0) {
          t += note.transformer.recovery_time.Day + "天";
          tfrt += 24 * 3600 * note.transformer.recovery_time.Day;
          tfrtt = "预估" + getDay(myDate.valueOf(), tfrt) + "之后可用";
        }
        if (note.transformer.recovery_time.Hour > 0) {
          t += note.transformer.recovery_time.Hour + "小时";
          tfrt += 3600 * note.transformer.recovery_time.Hour;
          tfrtt = "预估" + getDayTime(myDate, tfrt) + "之后可用";
        }
        if (note.transformer.recovery_time.Minute > 0) {
          t += note.transformer.recovery_time.Minute + "分";
          tfrt += 60 * note.transformer.recovery_time.Minute;
          tfrtt = "预估" + getDayTime(myDate, tfrt) + "之后可用";
        }
        if (note.transformer.recovery_time.Second > 0) {
          t += note.transformer.recovery_time.Second + "秒";
          tfrt += note.transformer.recovery_time.Second;
          tfrtt = getDayTime(myDate, tfrt) + "可用";
        }
        dtf.text = t;
        dtfrt.text = tfrtt;
        items.push(dtfrt);
      }
    } else {
      dtf.text = "尚未获得";
    }
    items.push(dtf);
    let dhc = {};
    dhc.css = initCss(300, 26, 200, 510, 30);
    let dhcrt = {};
    dhcrt.css = initCss(300, 26, 200, 550, 16);
    const hcrt = parseInt(note.home_coin_recovery_time);
    if (hcrt <= 0) {
      dhc.text = note.max_home_coin + "/" + note.max_home_coin;
      dhcrt.text = "";
    } else {
      dhc.text = note.current_home_coin + "/" + note.max_home_coin;
      dhcrt.text =
        getDay(myDate.valueOf(), hcrt) +
        format("hh:mm:ss", new Date(parseInt(myDate.valueOf() + hcrt * 1000))) +
        "回满";
    }
    items.push(dhc);
    items.push(dhcrt);
    const task = note.is_extra_task_reward_received ? -1 : note.finished_task_num;
    let dtask = {};
    dtask.css = initCss(228, 26, 200, 275, 30);
    if (task == -1) {
      dtask.text = "完成";
    } else if (task != null) dtask.text = task + "/4";
    items.push(dtask);

    let drrd = {};
    drrd.css = initCss(228, 26, 200, 350, 30);
    if (rrd == 0) drrd.text = "完成";
    else if (rrd != null) drrd.text = 3 - rrd + "/3";
    items.push(drrd);
    let num = 0;
    let endTime = 0;
    let minTime = 76800;
    for (var expedition of note.expeditions) {
      if (expedition) {
        let img = {};
        img.type = "img";
        let div = {};
        img.css = initCss(70, 70, 530, 115 + num * 72);
        div.css = initCss(258, 26, 622, 145 + num * 72, 20);
        img.src = expedition.avatar_side_icon.substring(
          expedition.avatar_side_icon.lastIndexOf("/") + 1,
          expedition.avatar_side_icon.length
        );
        if (expedition.status == "Ongoing") {
          endTime = parseInt(expedition.remained_time);
          if (endTime <= 0) {
            div.text = "已完成";
            minTime = 0;
          } else {
            if (num == 1 || endTime < minTime) minTime = endTime;
            div.text = getDayTime(myDate, endTime) + "完成";
          }
        } else if (expedition.status == "Finished") {
          div.text = "已完成";
          minTime = 0;
        }
        items.push(img);
        items.push(div);
      }
      num++;
    }
    if (minTime > 0) {
      let dert = {};
      dert.css = initCss(258, 26, 610, 80, 16);
      dert.text = "最快" + getDayTime(myDate, minTime) + "完成派遣";
      items.push(dert);
    }
  } catch (e) {
    msg.bot.logger.error(e);
  }
  render(msg, { items, bg }, "genshin-note");
  return undefined;
}

async function doSetCookie(msg, uid) {
  let cookie = msg.text.slice(9);
  cookie = cookie.replace(new RegExp(`['"<>]`, "gm"), "");
  let cookie_token = getCookieValue(cookie, "cookie_token");
  let account_id = getCookieValue(cookie, "account_id");
  let login_ticket = getCookieValue(cookie, "login_ticket");
  if (account_id == undefined) account_id = getCookieValue(cookie, "login_uid");
  if (login_ticket != undefined && account_id != undefined) {
    try {
      const { stoken } = await mybCookiePromise(account_id, login_ticket, msg.uid, msg.bot);
      cookie = `stuid=${account_id}; stoken=${stoken};`;
      await setMYBCookie(uid, cookie, msg.bot);
    } catch (e) {}
  }
  if (account_id == undefined || cookie_token == undefined) {
    return ` 未找到登录信息！请登录并进入米哈游通行证页面，再次尝试获取Cookie。`;
  }
  cookie = `cookie_token=${cookie_token}; account_id=${account_id};`;
  if (login_ticket != undefined) cookie += ` login_uid=${account_id}; login_ticket=${login_ticket};`;
  await setUserCookie(uid, cookie, msg.bot);
  setCacheTimeout(msg.uid, msg.bot);
  return ` 已设置cookie`;
}

function getCookieValue(loginCookie, key) {
  let s = loginCookie.indexOf(key);
  if (s == -1) return undefined;
  s += key.length + 1;
  let e = loginCookie.indexOf(";", s);
  if (e == -1) return loginCookie.substring(s);
  return loginCookie.substring(s, e);
}

async function doSetMYBCookie(msg, uid) {
  let cookie = msg.text.slice(9);
  cookie = cookie.replace(new RegExp(`['"<>]`, "gm"), "");
  if (cookie.indexOf("stuid") == -1 || cookie.indexOf("stoken") == -1 || cookie.indexOf("login_ticket") == -1) {
    let login_ticket = getCookieValue(cookie, "login_ticket");
    let account_id = getCookieValue(cookie, "login_uid");
    if (account_id == undefined) account_id = getCookieValue(cookie, "account_id");
    if (login_ticket == undefined || account_id == undefined)
      return ` 未找到登录信息！请登录并进入米哈游通行证页面，再次尝试获取Cookie。`;
    else {
      const { stoken } = await mybCookiePromise(account_id, login_ticket, msg.uid, msg.bot);
      cookie = `stuid=${account_id}; stoken=${stoken};`;
    }
  }

  await setMYBCookie(uid, cookie, msg.bot);
  return ` 已设置米游币cookie`;
}

async function Plugin(msg) {
  let dbInfo = undefined; // 米游社 ID
  if (hasEntrance(msg.text, "note", "set_user_cookie") || hasEntrance(msg.text, "note", "set_myb_cookie")) {
    dbInfo = await getID("", msg.uid);
  } else dbInfo = await getID(msg.text, msg.uid);
  const args = filterWordsByRegex(msg.text, ...global.command.functions.entrance.card);
  let uid, region;
  let message = undefined;
  if ("string" === typeof dbInfo) {
    await msg.bot.say(msg.sid, dbInfo, msg.type, msg.uid);
    return;
  }

  if (!dbInfo) {
    await msg.bot.say(msg.sid, "请先绑定米游社通行证 ID。", msg.type, msg.uid, true);
    return;
  }
  let baseInfo;
  try {
    baseInfo = await baseDetail(dbInfo, msg.uid, msg.bot);
    uid = baseInfo[0];
    region = baseInfo[1];
  } catch (e) {
    try {
      await msg.bot.say(msg.sid, `获取游戏UID失败：${JSON.stringify(e)}`, msg.type, msg.uid);
    } catch {
      await msg.bot.say(msg.sid, `获取游戏UID失败：${e}`, msg.type, msg.uid);
    }
    return;
  }
  try {
    if (hasEntrance(msg.text, "note", "talent_list")) {
      if ((await getUserCookie(uid, msg.bot)) == undefined) {
        message = `未设置私人Cookie`;
      } else {
        try {
          const detailInfo = await indexDetail(...baseInfo, msg.uid, msg.bot);
          await characterDetail(...baseInfo, detailInfo, false, msg.bot);
        } catch (e) {}
        message = await doTalentList(msg, uid, region, args);
      }
    } else if (hasEntrance(msg.text, "note", "fivestar")) {
      if ((await getUserCookie(uid, msg.bot)) == undefined) {
        message = `未设置私人Cookie`;
      } else {
        try {
          const detailInfo = await indexDetail(...baseInfo, msg.uid, msg.bot);
          await characterDetail(...baseInfo, detailInfo, false, msg.bot);
        } catch (e) {}
        const data = db.get("info", "user", { uid });
        var fiveStar = {};
        fiveStar.up_avatars = [];
        fiveStar.other_avatars = [];
        fiveStar.up_weapons = [];
        fiveStar.other_weapons = [];
        fiveStar.up_avatars_num = 0;
        fiveStar.other_avatars_num = 0;
        fiveStar.up_weapons_num = 0;
        fiveStar.other_weapons_num = 0;
        fiveStar.uid = data.uid;
        fiveStar.nickname = data.nickname;
        fiveStar.level = data.level;
        for (var i = 0; i < data.avatars.length; i++) {
          var avatar = data.avatars[i];
          if (avatar.rarity === 5) {
            if (avatar.id != 10000007 /*荧*/ && avatar.id != 10000005 /*空*/) {
              if (
                avatar.id === 10000035 /*七七*/ ||
                avatar.id === 10000042 /*刻晴*/ ||
                avatar.id === 10000003 /*琴*/ ||
                avatar.id === 10000016 /*迪卢克*/ ||
                avatar.id === 10000041 /*莫娜*/
              ) {
                fiveStar.other_avatars_num += avatar.actived_constellation_num + 1;
                fiveStar.other_avatars[fiveStar.other_avatars.length] = avatar;
              } else {
                fiveStar.up_avatars_num += avatar.actived_constellation_num + 1;
                fiveStar.up_avatars[fiveStar.up_avatars.length] = avatar;
              }
            }
          }
          if (avatar.weapon != null) {
            if (avatar.weapon.rarity === 5) {
              if (
                avatar.weapon.name === "天空之傲" ||
                avatar.weapon.name === "天空之刃" ||
                avatar.weapon.name === "天空之卷" ||
                avatar.weapon.name === "天空之翼" ||
                avatar.weapon.name === "天空之脊" ||
                avatar.weapon.name === "四风原典" ||
                avatar.weapon.name === "阿莫斯之弓" ||
                avatar.weapon.name === "风鹰剑" ||
                avatar.weapon.name === "狼的末路" ||
                avatar.weapon.name === "和璞鸢"
              ) {
                fiveStar.other_weapons_num += avatar.weapon.affix_level;
                fiveStar.other_weapons[fiveStar.other_weapons.length] = avatar.weapon;
              } else {
                fiveStar.up_weapons_num += avatar.weapon.affix_level;
                fiveStar.up_weapons[fiveStar.up_weapons.length] = avatar.weapon;
              }
            }
          }
        }
        const qqid =
          "" === args ? msg.uid : msg.text.includes("[CQ:at") ? parseInt(msg.text.match(/\d+/g)[0]) : undefined;

        if (undefined !== qqid) {
          fiveStar.qqid = qqid;
        }
        //msg.bot.logger.debug(`five：${JSON.stringify(fiveStar)}`);
        render(msg, fiveStar, "genshin-five");
        return;
      }
    } else if (hasEntrance(msg.text, "note", "set_user_cookie")) {
      message = await doSetCookie(msg, uid);
    } else if (hasEntrance(msg.text, "note", "re_sign")) {
      message = await doReSign(msg, uid, region);
    } else if (hasEntrance(msg.text, "note", "sign_in")) {
      message = await doSign(msg, uid, region);
      try {
        if ((await getMYBCookie(uid, msg.bot)) != undefined) {
          message += `
${await doGetMYB(msg, uid, region)}`;
        }
      } catch (e) {
        if ("" !== e) {
          message += `
米游币签到：${e}`;
        }
      }
    } else if (hasEntrance(msg.text, "note", "set_myb_cookie")) {
      message = await doSetMYBCookie(msg, uid, region);
    } else if (hasEntrance(msg.text, "note", "get_myb")) {
      message = await doGetMYB(msg, uid, region);
    } else if (
      hasEntrance(msg.text, "note", "ledger") ||
      hasEntrance(msg.text, "note", "lastledger") ||
      hasEntrance(msg.text, "note", "lastlastledger")
    ) {
      message = await doLedger(msg, uid, region);
    } else if (hasEntrance(msg.text, "note", "auto_sign_in")) {
      let { auto } = await isAuto(msg);
      if ((await getUserCookie(uid, msg.bot)) == undefined) {
        message = `未设置私人Cookie`;
      } else if (auto == true) {
        message = `请勿重复开启`;
      } else {
        await changeAuto(uid, region, true, msg);
        message = `已开启自动签到`;
      }
    } else if (hasEntrance(msg.text, "note", "cancel_auto_sign_in")) {
      let { auto } = await isAuto(msg);
      if (auto == true) {
        await changeAuto(uid, region, false, msg);
        message = `已关闭自动签到`;
      } else {
        message = `未开启自动签到`;
      }
    } else if (hasEntrance(msg.text, "note", "del_user_cookie")) {
      try {
        await setUserCookie(uid, "", msg.bot);
      } catch {
        await msg.bot.say(msg.sid, `清除Cookie失败，请确认是否设置过~`, msg.type, msg.uid);
        return;
      }
      setCacheTimeout(msg.uid, msg.bot);
      message = `已清除cookie`;
    } else {
      message = await doPicNote(msg, uid, region);
    }
  } catch (e) {
    if ("" !== e) {
      msg.bot.logger.debug(`error：${JSON.stringify(e)}`);
      await msg.bot.say(msg.sid, ` ${e}`, msg.type, msg.uid);
      return;
    }
  }
  if (message != undefined) await msg.bot.say(msg.sid, message, msg.type, msg.uid);
}

async function Wrapper(Message, bot) {
  try {
    await Plugin(Message, bot);
  } catch (e) {
    bot.logger.error(e);
  }
}

export { Wrapper as run };
