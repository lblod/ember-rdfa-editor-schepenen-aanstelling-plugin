import Component from '@ember/component';
import layout from '../../templates/components/schepenen-aanstelling/schepenen-table-row';

export default Component.extend({
  layout,
  tagName: 'tr',

  actions: {
    remove(){
      this.onRemove(this.mandataris);
    }
  }
});
