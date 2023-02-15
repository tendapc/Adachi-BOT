import { html } from "../common/utils.js";

const { defineComponent } = window.Vue;
const avatarTemplate = html`<div class="avatar">
  <div class="name_cont" :class="data.rarity === 5 ? 'star5' : 'star4'">
    <div class="name">
      <div class="avatar_img">
        <img :src="data.icon" onerror="whenError(this)" />
      </div>
      <div class="avatar_name">{{data.id === 10000007 ? '荧' : data.id === 10000005 ? '空' : data.name}}</div>
    </div>
  </div>
  <div class="lvl" :class="data.level === 90 ? 'lvl90':''">{{data.level}}</div>
  <div class="fetter" :class="(data.fetter === 10 || data.id === 10000007 || data.id === 10000005) ? 'fetter10':''">
    {{(data.id === 10000007 || data.id === 10000005)?'':''+data.fetter}}
  </div>
  <div class="cons">
    <span :class="'life'+data.constellationNum">{{data.id === 10000062 ? '-':''+data.actived_constellation_num}}</span>
  </div>
  <div class="talent" :class="'lv'+data.skills.a_lvl">{{data.skills.a.level_current}}</div>
  <div class="talent" :class="'lv'+data.skills.e_lvl + (data.skills.e_plus ? ' talent_plus':'')">
    {{data.skills.e.level_current}}
  </div>
  <div class="talent" :class="'lv'+data.skills.q_lvl + (data.skills.q_plus ? ' talent_plus':'')">
    {{data.skills.q.level_current}}
  </div>
  <div class="weapon for_weapon" :class="' weapon_' + data.weapon.rarity">
    <div class="weapon_box">
      <span class="weapon_lv">Lv{{data.weapon.level}}</span>
      <span class="weapon_alv" :class="' weapon_alv_'+data.weapon.affix_level">{{data.weapon.affix_level}}</span>
      <img :src="data.weapon.icon" />
      <span class="weapon_name">{{data.weapon.name}}</span>
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
    return {};
  },
});
export { AvatarBox };
