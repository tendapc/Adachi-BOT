import { hasEntrance } from "../../utils/config.js";
import { getID } from "../../utils/id.js";
import { render } from "../../utils/render.js";
import db from "#utils/database";
import { baseDetail, characterDetail, indexDetail } from "#utils/detail";
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

async function doPicNote(msg, uid, region) {
  const noteInfo = await notePromise(uid, region, msg.uid, msg.bot);
  const note = noteInfo[1];
  const baseTime = noteInfo[0];
  render(msg, { baseTime, note }, "genshin-note");
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
  const dbInfo = await getID(msg.text, msg.uid); // 米游社 ID
  let uid, region;
  let message = undefined;
  if ("string" === typeof dbInfo) {
    await msg.bot.say(sendID, dbInfo, msg.type, msg.uid);
    return;
  }

  if (!dbInfo) {
    msg.bot.say(msg.sid, "请先绑定米游社通行证 ID。", msg.type, msg.uid, true);
    return;
  }
  try {
    const baseInfo = await baseDetail(dbInfo, msg.uid, msg.bot);
    uid = baseInfo[0];
    region = baseInfo[1];
  } catch (e) {
    await msg.bot.say(msg.sid, `获取游戏UID失败：${e}`, msg.type, msg.uid);
    return;
  }
  try {
    if (hasEntrance(msg.text, "note", "fivestar")) {
      if ((await getUserCookie(uid, msg.bot)) == undefined) {
        message = `未设置私人Cookie`;
      } else {
        const detailInfo = await indexDetail(...baseInfo, msg.uid, msg.bot);
        await characterDetail(...baseInfo, detailInfo, false, msg.bot);
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
