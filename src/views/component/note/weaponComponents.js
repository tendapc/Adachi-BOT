import { html } from "../common/utils.js";

const { defineComponent } = window.Vue;
const weaponTemplate = html` <div class="character-box">
  <div class="container-char-headups">
    <div />
    <div class="constellation" :class="data.affix_level === 5 ? 'max-constellation' : ''">{{ data.affix_level }}</div>
  </div>
  <img class="main" :src="data.icon" :style="{ 'background-image': 'url(' + starBackground + ')' }" alt="ERROR" />

  <div class="char-info">
    <div class="container-char-info weapon-briefing" :style="additionalStyle">
      <span class="weapon-name">{{ data.name }}</span>
      <span class="weapon-affix">精{{ data.affix_level }}</span>
    </div>
  </div>
</div>`;
const WeaponBox = defineComponent({
  name: "WeaponBox",
  template: weaponTemplate,
  props: {
    data: Object,
  },
  setup(props) {
    const starBackground = encodeURI(
      `http://localhost:9934/resources/Version2/thumb/stars/${props.data.rarity}-Star.png`
    );

    const weaponNameLength = props.data.name.length || 5;
    const additionalStyle = weaponNameLength > 5 ? "font-size: 9px;" : undefined;

    return { starBackground, additionalStyle };
  },
});
export { WeaponBox };
