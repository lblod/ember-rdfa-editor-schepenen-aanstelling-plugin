import Component from '@ember/component';
import layout from '../../templates/components/schepenen-aanstelling/add-new-schepen';
import MandatarisToCreate from '../../models/mandataris-to-create';
export default Component.extend({
  tagName: 'tr',
  layout,

  initNewSchepen(persoon) {
    const mandataris = MandatarisToCreate.create({});
    mandataris.set('bekleedt', this.schepenMandaat);
    mandataris.set('rangorde', '');
    mandataris.set('isBestuurlijkeAliasVan', persoon);
    mandataris.set('status', {label: '', uri: ''});
    this.set('selectedMandataris', mandataris);
  },

  actions: {
    select(persoon){
      this.initNewSchepen(persoon);
    },

    save(){
      this.onSave(this.selectedMandataris);
      this.set('selectedMandataris', null);
    },

    cancel(){
      this.set('selectedMandataris', null);
      this.onCancel();
    }
  }
});
