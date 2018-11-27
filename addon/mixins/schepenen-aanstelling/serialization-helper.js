import Mixin from '@ember/object/mixin';
import RdfaContextScanner from '@lblod/ember-rdfa-editor/utils/rdfa-context-scanner';
import { A } from '@ember/array';
import { inject as service } from '@ember/service';
import MandatarisToCreate from '../../models/mandataris-to-create';

export default Mixin.create({
  store: service(),
  expandedExt: 'http://mu.semte.ch/vocabularies/ext/',
  oudMandaatPredicate: 'http://mu.semte.ch/vocabularies/ext/oudMandaat',
  schepenClassificatieUri: 'http://data.vlaanderen.be/id/concept/BestuursfunctieCode/5ab0e9b8a3b2ca7c5e000014',
  collegeClassificatieUri: 'http://data.vlaanderen.be/id/concept/BestuursorgaanClassificatieCode/5ab0e9b8a3b2ca7c5e000006',

  getMandatarisTableNode(){
    return  document.querySelectorAll("[property='ext:mandatarisTabelInput']")[0]
      ||  document.querySelectorAll(`[property='${this.expandedExt}/mandatarisTabelInput']`)[0];
  },

  async setMandaatSchepen(){
    if(this.schepenMandaat)
      return;
    //not sure if we will need it
    // let query = {
    //   'filter[is-tijdsspecialisatie-van][bestuurseenheid][:uri:]': this.bestuurseenheid.uri,
    //   'filter[is-tijdsspecialisatie-van][classificatie][:uri:]': this.collegeClassificatieUri,
    //   'sort': '-binding-start'
    // };
    // let college = (await this.query('bestuursorgaan', query)).firstObject;

    //take mandaat schepen from latest bestuursorgaan in tijd
    let query = {
      'filter[bevat-in][is-tijdsspecialisatie-van][bestuurseenheid][:uri:]': this.bestuurseenheid.uri,
      'filter[bevat-in][is-tijdsspecialisatie-van][classificatie][:uri:]': this.collegeClassificatieUri,
      'filter[bestuursfunctie][:uri:]': this.schepenClassificatieUri,
      'sort': '-bevat-in.binding-start'
    };
    let schepenMandaat = (await this.store.query('mandaat', query)).firstObject;
    this.set('schepenMandaat', schepenMandaat);
  },

  serializeTableToTriples(table){
    const contextScanner = RdfaContextScanner.create({});
    const contexts = contextScanner.analyse(table).map((c) => c.context);
    return Array.concat(...contexts);
  },

  async instantiateSchepenen(triples){
    await this.setMandaatSchepen();
    const resources = triples.filter((t) => t.predicate === 'a');
    const mandatarissen = A();
    for (let resource of resources) {
      if(!this.isResourceNewMandataris(resource, triples, mandatarissen))
        continue;
      mandatarissen.pushObject(await this.loadSchepenFromTriples(triples.filter((t) => t.subject === resource.subject)));
    }
    return mandatarissen;
   },

  async instantiateNewSchepenen(triples){
    await this.setMandaatSchepen();
    const persons = triples.filter(t => t.predicate === 'http://data.vlaanderen.be/ns/mandaat#isBestuurlijkeAliasVan').map(t => t.object);
    let personUris = Array.from(new Set(persons));
    const mandatarissen = A();
    for (let personUri of personUris) {
      mandatarissen.pushObject(await this.initNewSchepen(personUri));
    }
    return mandatarissen;
  },

  async initNewSchepen(persoonURI) {
    const mandataris = MandatarisToCreate.create({});
    mandataris.set('bekleedt', this.schepenMandaat);
    mandataris.set('rangorde', '');
    const persoon = await this.store.query('persoon',
                                           {
                                             filter: {
                                               ':uri:': persoonURI,
                                               'is-kandidaat-voor': { 'rechtstreekse-verkiezing': {'stelt-samen': {':uri:': this.bestuursorgaan.uri}}}
                                             },
                                             include: 'is-kandidaat-voor'
                                           });
    mandataris.set('isBestuurlijkeAliasVan', persoon.get('firstObject'));
    return mandataris;
  },

  async loadSchepenFromTriples(triples){
    const mandataris = MandatarisToCreate.create({ uri: triples[0].subject});
    mandataris.set('bekleedt', this.schepenMandaat);
    mandataris.set('rangorde', (triples.find(t => t.predicate === mandataris.rdfaBindings.rangorde) || {}).object || '');
    mandataris.set('start', ((triples.find(t => t.predicate === mandataris.rdfaBindings.start)) || {}).object);
    mandataris.set('einde', ((triples.find(t => t.predicate === mandataris.rdfaBindings.einde)) || {}).object);
    const persoonURI = triples.find((t) => t.predicate === mandataris.rdfaBindings.isBestuurlijkeAliasVan);

    if (persoonURI) {
      const persoon = await this.store.query('persoon',
                                             {
                                               filter: {
                                                 ':uri:': persoonURI.object,
                                                 'is-kandidaat-voor': { 'rechtstreekse-verkiezing': {'stelt-samen': {':uri:': this.bestuursorgaan.uri}}}
                                               },
                                               include: 'is-kandidaat-voor'
                                             });
      mandataris.set('isBestuurlijkeAliasVan', persoon.get('firstObject'));
    }
    return mandataris;
  },

  isResourceNewMandataris(resource, triples, loadedMandatarissen){
    return resource.object === 'http://data.vlaanderen.be/ns/mandaat#Mandataris' &&
      ! loadedMandatarissen.some( (m) => m.uri === resource.subject) &&
      ! triples.some((t) => t.predicate === this.oudMandaatPredicate && t.object === resource.subject);
  }
});
