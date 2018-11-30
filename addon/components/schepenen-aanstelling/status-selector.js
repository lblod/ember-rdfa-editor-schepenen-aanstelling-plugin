import Component from '@ember/component';
import layout from '../../templates/components/schepenen-aanstelling/status-selector';
import { inject as service } from '@ember/service';
import { task, timeout } from 'ember-concurrency';

export default Component.extend({
  layout,
  store: service(),

  actions: {
    select(status) {
      this.mandataris.set('status', status);
    }
  }
});
