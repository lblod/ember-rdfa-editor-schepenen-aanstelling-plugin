import Component from '@ember/component';
import layout from '../../templates/components/schepenen-aanstelling/rangorde-selector';
import { rangordeValues } from '../../models/mandataris-to-create';

export default Component.extend({
  layout,
  options: rangordeValues,
  actions: {
    select(rangorde) {
      this.mandataris.set('rangorde', rangorde);
    }
  }
});
