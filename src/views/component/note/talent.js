import { getParams, html } from "../common/utils.js";
import { AvatarBox } from "./avatar.js";

const { defineComponent } = window.Vue;
const lodash = window._;

const template = html`
  <div class="card-container">
    <img class="avatar" :src="namecardAvatar" />
    <div class="namecard-container" :style="{'background': nameCard}">
      <div class="player-info-container">
        <p v-if="hasPlayerNameInfo" class="player-name">{{ playerNickname }}</p>
        <p class="uid">UID {{ playerUid }}</p>
      </div>
    </div>
    <div class="info-container">
      <div class="section-container" id="character-box">
        <div class="container-character-box main-content">
          <AvatarBox v-for="avatar in avatars" :data="avatar" />
        </div>
      </div>
    </div>
    <div id="credit">Created by Adachi-BOT</div>
  </div>
`;

export default defineComponent({
  name: "genshinTalent",
  template: template,
  components: {
    AvatarBox,
  },
  setup() {
    const params = getParams(window.location.href);
    const { uid, nickname } = params;
    const hasPlayerNameInfo = params.nickname !== "";
    const randomAvatarOrder = Math.floor(Math.random() * params.avatars.length);
    const target = params.avatars[randomAvatarOrder];
    const targetHasCostume = params.avatars[randomAvatarOrder]["costumes"].length !== 0;
    const costumeName = targetHasCostume ? params.avatars[randomAvatarOrder]["costumes"][0]["name"] : "";
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
      nameCard,
      namecardAvatar,
      hasPlayerNameInfo,
      avatars: params.avatars,
    };
  },
});
