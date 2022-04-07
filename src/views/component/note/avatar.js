import { html } from "../common/utils.js";

const { defineComponent } = window.Vue;
const avatarTemplate = html`<div class="avatar">
  <div class="index star{{data.rarity}}"></div>
  <div class="name_cont star{{data.rarity}}">
    <div class="name">
      <div class="avatar_img">
        <img :src="data.icon" onerror="whenError(this)" />
      </div>
      <div class="avatar_name">{{data.name}}</div>
    </div>
  </div>
  <div class="lvl lvl{{data.level}}">{{data.level}}</div>
  <div class="fetter fetter{{data.fetter}}">{{data.fetter}}</div>
  <div class="cons"><span class="life{{data.actived_constellation_num}}">{{data.actived_constellation_num}}</span></div>
  <div class="talent lv{{data.skills.a_lvl}}">{{data.skills.a}}</div>
  <div class="talent lv{{data.skills.e_lvl}} {{data.skills.e_plus ? 'talent_plus':''}}">{{data.skills.e}}</div>
  <div class="talent lv{{data.skills.q_lvl}} {{data.skills.q_plus ? 'talent_plus':''}}">{{data.skills.q}}</div>
</div>`;
const AvatarBox = defineComponent({
  name: "AvatarBox",
  template: avatarTemplate,
  props: {
    data: Object,
  },
  setup(props) {
    function getCostume(costumeName) {
      return encodeURI(`http://localhost:9934/resources/Version2/costumes/avatars/${costumeName}.png`);
    }

    const starBackground = encodeURI(
      `http://localhost:9934/resources/Version2/thumb/stars/${props.data.rarity}-Star.png`
    );
    const element = encodeURI(`http://localhost:9934/resources/gacha/element/${props.data.element.toLowerCase()}.png`);
    const hasCostume = props.data.costumes.length !== 0;
    const costumePath = hasCostume ? getCostume(props.data.costumes[0]["name"]) : "";

    const weaponNameLength = props.data.weapon.name.length || 5;
    const additionalStyle = weaponNameLength > 5 ? "font-size: 9px;" : undefined;

    return { starBackground, element, hasCostume, costumePath, additionalStyle };
  },
});
export { AvatarBox };
