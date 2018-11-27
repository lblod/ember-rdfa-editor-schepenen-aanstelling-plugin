import Component from '@ember/component';
import layout from '../../templates/components/schepenen-aanstelling/output-rdfa';
import { computed } from '@ember/object';

export default Component.extend({
  layout,
  sortedMandatarissen: computed('mandatarissen.[]', function(){
    return this.mandatarissen.sort((a,b) => a.isBestuurlijkeAliasVan.gebruikteVoornaam.trim().localeCompare(b.isBestuurlijkeAliasVan.gebruikteVoornaam.trim()));
  })
});
