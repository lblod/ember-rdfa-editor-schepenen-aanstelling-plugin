import Component from '@ember/component';
import layout from '../../templates/components/schepenen-aanstelling/schepenen-table';
import SerializationHelper from '../../mixins/schepenen-aanstelling/serialization-helper';
import { task } from 'ember-concurrency';
import { computed } from '@ember/object';
import { rangordeValues } from '../../models/mandataris-to-create';

export default Component.extend(SerializationHelper, {
  layout,
  rangordeAsc: true,
  naamAsc: true,

  setMandatarisStatusCodes: task(function* () {
    let codes = yield this.store.findAll('mandataris-status-code');
    this.set('mandatarisStatusCodes', codes);
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

  sortMandatarissen(prop, asc = true){
    if(prop == 'rangorde' && asc){
      let sm = this.mandatarissen.sort(this.rangordeSort);
      this.set('sortedMandatarissen', sm);
      return;
    }

    if(prop == 'rangorde'){
      let sm = this.mandatarissen.sort(this.rangordeSort);
      this.set('sortedMandatarissen', sm.toArray().reverse());
      return;
    }

    if(prop == 'naam' && asc){
      let sm = this.mandatarissen.sort((a,b) => a.isBestuurlijkeAliasVan.gebruikteVoornaam.trim().localeCompare(b.isBestuurlijkeAliasVan.gebruikteVoornaam.trim()));
      this.set('sortedMandatarissen', sm);
      return;
    }

    if(prop == 'naam'){
      let sm = this.mandatarissen.sort((a,b) => a.isBestuurlijkeAliasVan.gebruikteVoornaam.trim().localeCompare(b.isBestuurlijkeAliasVan.gebruikteVoornaam.trim()));
      this.set('sortedMandatarissen', sm.toArray().reverse());
      return;
    }

  },

  didReceiveAttrs() {
    this._super(...arguments);
    if(this.mandatarissen)
      this.setMandatarisStatusCodes.perform();
      this.sortMandatarissen('naam', this.naamAsc);
  },

  actions: {
    remove(mandataris){
      this.mandatarissen.removeObject(mandataris);
    },
    addMandataris(){
      this.set('addMandatarisMode', true);
    },
    cancelAddMandataris(){
      this.set('addMandatarisMode', false);
    },
    saveAddMandataris(mandataris){
      //remove potential duplicate
      let toDelete = this.mandatarissen.find(m => m.isBestuurlijkeAliasVan.uri == mandataris.isBestuurlijkeAliasVan.uri);
      if(toDelete)
        this.mandatarissen.removeObject(toDelete);
      this.mandatarissen.pushObject(mandataris);
      this.set('addMandatarisMode', false);
    },
    sortRangorde(){
      this.toggleProperty('rangordeAsc');
      this.sortMandatarissen('rangorde', this.rangordeAsc);
    },
    sortNaam(){
      this.toggleProperty('naamAsc');
      this.sortMandatarissen('naam', this.naamAsc);
    }
  }
});
