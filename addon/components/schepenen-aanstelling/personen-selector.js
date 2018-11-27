import Component from '@ember/component';
import layout from '../../templates/components/schepenen-aanstelling/personen-selector';
import { inject as service } from '@ember/service';
import { task, timeout } from 'ember-concurrency';

export default Component.extend({
  layout,
  store: service(),

  didReceiveAttrs(){
    this._super(...arguments);
    this.set('_persoon', this.persoon);
  },

  searchByName: task(function* (searchData) {
    yield timeout(300);
    let queryParams = {
      sort:'achternaam',
      'filter': searchData.trim(),
      'filter[is-kandidaat-voor][rechtstreekse-verkiezing][stelt-samen][:uri:]': this.bestuursorgaan.uri,
      page: { size: 100 },
      include: 'geboorte'
    };
    let personen = yield this.store.query('persoon', queryParams);
    return personen;
  }),

  actions: {
    select(persoon){
      this.set('_persoon', persoon);
      this.onSelect(persoon);
    }
  }
});
