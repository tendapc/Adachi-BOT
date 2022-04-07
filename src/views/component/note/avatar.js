import { html } from "../common/utils.js";

const { defineComponent } = window.Vue;
const avatarTemplate = html`<div class="character-box">
  <div class="container-char-headups">
    <img v-if="data.element !== 'None'" class="element" :src="element" alt="ERROR" />
    <div class="constellation" :class="data.constellationNum === 6 ? 'max-constellation' : ''">
      {{ data.constellationNum }}
    </div>
  </div>
  <img
    v-if="hasCostume"
    class="main"
    :src="costumePath"
    :style="{ 'background-image': 'url(' + starBackground + ')' }"
    alt="ERROR"
  />
  <img
    v-else
    class="main"
    :src="data.icon"
    :style="{ 'background-image': 'url(' + starBackground + ')' }"
    alt="ERROR"
  />

  <div class="char-info">
    <div class="container-char-info character-briefing">
      <span class="char-level">Lv.{{ data.level }}</span>
      <span class="char-fetter">好感{{ data.fetter }}</span>
    </div>
    <div class="container-char-info weapon-briefing" :style="additionalStyle">
      <span class="weapon-name">{{ data.weapon.name }}</span>
      <span class="weapon-affix">精{{ data.weapon.affix_level }}</span>
    </div>
  </div>
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
