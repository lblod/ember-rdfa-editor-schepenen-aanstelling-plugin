import Component from '@ember/component';
import layout from '../../templates/components/schepenen-aanstelling/schepenen-table';
import SerializationHelper from '../../mixins/schepenen-aanstelling/serialization-helper';
import { task } from 'ember-concurrency';
import { computed } from '@ember/object';

export default Component.extend(SerializationHelper, {
  layout,
  sortedMandatarissen: computed('mandatarissen.[]', function(){
    return this.mandatarissen.sort((a,b) => a.isBestuurlijkeAliasVan.gebruikteVoornaam.trim().localeCompare(b.isBestuurlijkeAliasVan.gebruikteVoornaam.trim()));
  }),

  getUpToDateMandatarissen: task(function *(){
    if(this.upToDateMandatarissen){
      return;
    }

    let table = this.getMandatarisTableNode();

    if(!table)
      return;

    let triples = this.serializeTableToTriples(table);
    if(triples.length == 0)
      return;

    let mandatarissen = yield this.instantiateMandatarissen(triples);
    this.set('upToDateMandatarissen', mandatarissen);
  }),

  actions: {
    remove(mandataris){
      this.mandatarissen.removeObject(mandataris);
    },
    addMandataris(){
      this.set('addMandatarisMode', true);
      this.getUpToDateMandatarissen.perform();
    },
    cancelAddMandataris(){
      this.set('addMandatarisMode', false);
    },
    saveAddMandataris(mandataris){
      //remove potential duplicate
      let toDelete = this.mandatarissen.find(m => m.uri == mandataris.uri);
      if(toDelete)
        this.mandatarissen.removeObject(toDelete);
      this.mandatarissen.pushObject(mandataris);
      this.set('addMandatarisMode', false);
    }
  }
});
