import { CharacterBox, ExplorationBox, SectionTitle } from "../card/cardComponents.js";
import { getParams, html } from "../common/utils.js";
import { WeaponBox } from "./weaponComponents.js";

const { defineComponent } = window.Vue;
const lodash = window._;

const template = html`
  <div class="card-container">
    <img class="avatar" :src="namecardAvatar" />
    <div class="namecard-container" :style="{'background': nameCard}">
      <div class="player-info-container">
        <p v-if="hasPlayerNameInfo" class="player-name">{{ playerNickname }}</p>
        <p class="uid">UID {{ playerUid }}</p>
        <p v-if="hasLevelInfo" class="adventure-rank">冒险等阶</p>
        <p v-if="hasLevelInfo" class="adventure-rank">{{ playerLevel }}</p>
      </div>
    </div>
    <div class="info-container">
      <div class="stats main-content">
        <p>常驻5星</p>
        <p>{{ other_avatars_num }}</p>
        <p>UP池5星</p>
        <p>{{ up_avatars_num }}</p>
        <p>常驻武器</p>
        <p>{{ other_weapons_num }}</p>
        <p>UP池武器</p>
        <p>{{ up_weapons_num }}</p>
      </div>
      <div class="section-container" id="character-box">
        <SectionTitle title="常驻5星角色" />
        <div class="container-character-box main-content">
          <CharacterBox v-for="character in other_avatars" :data="character" />
        </div>
        <SectionTitle title="UP5星角色" />
        <div class="container-character-box main-content">
          <CharacterBox v-for="character in up_avatars" :data="character" />
        </div>
        <SectionTitle title="常驻5星武器" />
        <div class="container-character-box main-content">
          <WeaponBox v-for="weapon in other_weapons" :data="weapon" />
        </div>
        <SectionTitle title="UP5星武器" />
        <div class="container-character-box main-content">
          <WeaponBox v-for="weapon in up_weapons" :data="weapon" />
        </div>
      </div>
      <!-- 数据 container 结束 -->
    </div>
    <div id="credit">Created by Adachi-BOT</div>
  </div>
`;

export default defineComponent({
  name: "genshinCard",
  template: template,
  components: {
    SectionTitle,
    ExplorationBox,
    CharacterBox,
  },
  setup() {
    const params = getParams(window.location.href);
    const { uid, nickname, level } = params;
    const hasLevelInfo = params.level !== -1;
    const hasPlayerNameInfo = params.nickname !== "";
    const randomAvatarOrder = Math.floor(Math.random() * params.up_avatars.length);
    const target = params.up_avatars[randomAvatarOrder];
    const targetHasCostume = params.up_avatars[randomAvatarOrder]["costumes"].length !== 0;
    const costumeName = targetHasCostume ? params.up_avatars[randomAvatarOrder]["costumes"][0]["name"] : "";
    const qqid = params.qqid || "";

    const ye = { 10000005: "空", 10000007: "荧" };
    const name = ye[target.id] || target.name;
    const id = 10000007 === target.id ? 10000005 : target.id; // 妹妹名片重定向至哥哥名片
    const nameCardUrl = encodeURI(`http://localhost:9934/resources/Version2/namecard/${id}.png`);
    const nameCard = `linear-gradient(hsla(0, 0%, 100%, 0) 0%, #fff 100%), url(${nameCardUrl})`;

    const character = targetHasCostume
      ? encodeURI(`http://localhost:9934/resources/Version2/costumes/avatars/${costumeName}.png`)
      : encodeURI(`http://localhost:9934/resources/Version2/thumb/character/${name}.png`);

    const namecardAvatar = "" !== qqid ? `https://q1.qlogo.cn/g?b=qq&s=5&nk=${qqid}` : character;

    return {
      playerUid: uid,
      playerNickname: nickname,
      playerLevel: level,
      nameCard,
      namecardAvatar,
      up_avatars: params.up_avatars,
      other_avatars: params.other_avatars,
      up_weapons: params.up_weapons,
      other_weapons: params.other_weapons,
      up_avatars_num: params.up_avatars_num,
      other_avatars_num: params.other_avatars_num,
      up_weapons_num: params.up_weapons_num,
      other_weapons_num: params.other_weapons_num,
      hasLevelInfo,
      hasPlayerNameInfo,
    };
  },
});
