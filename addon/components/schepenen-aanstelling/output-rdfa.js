import Component from '@ember/component';
import layout from '../../templates/components/schepenen-aanstelling/output-rdfa';
import { computed } from '@ember/object';
import { rangordeValues } from '../../models/mandataris-to-create';
import uuid from 'uuid/v4';

export default Component.extend({
  layout,
  sortedMandatarissen: computed('mandatarissen.[]', 'mandatarissen.@each.rangorde', 'mandatarissen.@each.status', function(){
    return this.mandatarissen.sort(this.rangordeSort);
  }),

  verhinderdeMandatarissen: computed('sortedMandatarissen', function(){
    return this.sortedMandatarissen.filter(m => m.status && m.status.label.trim().toLowerCase() == 'verhinderd');
  }),

  hasVerhinderdeMandatarissen: computed('verhinderdeMandatarissen', function(){
    return this.verhinderdeMandatarissen.length > 0;
  }),

  waarnemendMandatarissen: computed('sortedMandatarissen', function(){
    return this.sortedMandatarissen.filter(m => m.status && m.status.label.trim().toLowerCase() == 'waarnemend');
  }),

  effectiefMandatarissen: computed('sortedMandatarissen', function(){
    return this.sortedMandatarissen.filter(m => m.status && m.status.label.trim().toLowerCase() == 'effectief');
  }),

  rangordeSort(a,b){
    //without rangorde put them down
    if(rangordeValues.indexOf(a.rangorde.trim()) == -1){
      return rangordeValues.length + 1;
    }
    if(rangordeValues.indexOf(b.rangorde.trim()) == -1){
      return -(rangordeValues.length + 1);
    }
    return rangordeValues.indexOf(a.rangorde.trim()) - rangordeValues.indexOf(b.rangorde.trim());
  },

  artikelDrieUri: computed('', function(){
    return `http://data.lblod.info/artikels/${uuid()}`;
  }),

  artikelVierUri: computed('', function(){
    return `http://data.lblod.info/artikels/${uuid()}`;
  })
});
