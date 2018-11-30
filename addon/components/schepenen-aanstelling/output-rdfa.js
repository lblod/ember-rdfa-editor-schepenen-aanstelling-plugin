import Component from '@ember/component';
import layout from '../../templates/components/schepenen-aanstelling/output-rdfa';
import { computed } from '@ember/object';
import { rangordeValues } from '../../models/mandataris-to-create';

export default Component.extend({
  layout,
  sortedMandatarissen: computed('mandatarissen.[]', 'mandatarissen.@each.rangorde', 'mandatarissen.@each.status', function(){
    return this.mandatarissen.sort(this.rangordeSort);
  }),

  verhinderdeMandatarissen: computed('sortedMandatarissen', function(){
    return this.sortedMandatarissen.filter(m => m.status.label.trim().toLowerCase() == 'verhinderd');
  }),

  waarnemendMandatarissen: computed('sortedMandatarissen', function(){
    return this.sortedMandatarissen.filter(m => m.status.label.trim().toLowerCase() == 'waarnemend');
  }),

  effectiefMandatarissen: computed('sortedMandatarissen', function(){
    return this.sortedMandatarissen.filter(m => m.status.label.trim().toLowerCase() == 'effectief');
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
});
