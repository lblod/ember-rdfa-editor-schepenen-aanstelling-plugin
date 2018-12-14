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
  verkozenGevolgUri: 'http://data.vlaanderen.be/id/concept/VerkiezingsresultaatGevolgCode/89498d89-6c68-4273-9609-b9c097727a0f',

  async setProperties() {
    let bestuurseenheid = ( await this.store.query('bestuurseenheid',
                                           { 'filter[bestuursorganen][heeft-tijdsspecialisaties][:uri:]': this.bestuursorgaanUri }
                                                 )).firstObject;
    this.set('bestuurseenheid', bestuurseenheid);

    let bestuursorgaan = (await this.store.query('bestuursorgaan',
                                                  { 'filter[:uri:]': this.bestuursorgaanUri }
                                                )).firstObject;
    this.set('bestuursorgaan', bestuursorgaan);

    await this.setMandaatSchepen();
    await this.setCachedPersonen();
    await this.setMandatarisStatusCodes();
  },

  getMandatarisTableNode(){
    return  document.querySelectorAll("[property='ext:mandatarisTabelInput']")[0]
      ||  document.querySelectorAll(`[property='${this.expandedExt}/mandatarisTabelInput']`)[0];
  },

  async setMandatarisStatusCodes(){
    let codes = await this.store.findAll('mandataris-status-code');
    //Remove titelVoerend
    codes = codes.filter(c => c.uri != 'http://data.vlaanderen.be/id/concept/MandatarisStatusCode/aacb3fed-b51d-4e0b-a411-f3fa641da1b3');
    this.set('mandatarisStatusCodes', codes);
  },

  async setCachedPersonen(){
    //a subset of peronen of interest
    let resultaten = await this.store.query('verkiezingsresultaat',
                                            {
                                              filter: {
                                                'is-resultaat-voor' : {
                                                  'rechtstreekse-verkiezing': {
                                                    'stelt-samen': {
                                                      ':uri:': this.bestuursorgaan.uri
                                                    }
                                                  }
                                                },
                                                'gevolg': {
                                                  ':uri:': this.verkozenGevolgUri
                                                }
                                              },
                                              include: 'is-resultaat-van.geboorte',
                                              page: { size: 1000 },
                                              sort:'is-resultaat-van.gebruikte-voornaam'
                                            });
    this.set('cachedPersonen', resultaten.map((res) => res.isResultaatVan) || A());
  },

  async smartFetchPersoon(subjectUri){
    let persoon = this.cachedPersonen.find(p => p.get('uri') == subjectUri);
    if(persoon)
      return persoon;
    //if not existant try to create it on based on information in triples

    persoon = (await this.store.query('persoon', { 'filter[:uri:]': subjectUri })).firstObject;
    if(!persoon)
      return null;

   //set cache so it may be found later
   this.cachedPersonen.pushObject(persoon);
   return persoon;
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
    await this.setProperties();
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
    await this.setProperties();
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
    mandataris.set('status', {label: '', uri: ''});
    mandataris.set('isBestuurlijkeAliasVan', await this.smartFetchPersoon(persoonURI));
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
      mandataris.set('isBestuurlijkeAliasVan', await this.smartFetchPersoon(persoonURI.object));
    }

    let statusUri = ((triples.find(t => t.predicate === mandataris.rdfaBindings.status)) || {}).object;
    mandataris.set('status', {label: '', uri: ''});
    if(statusUri){
      let status  = this.mandatarisStatusCodes.find(c => c.uri == statusUri);
      mandataris.set('status', status || {label: '', uri: ''});
    }

    return mandataris;
  },

  isResourceNewMandataris(resource, triples, loadedMandatarissen){
    return resource.object === 'http://data.vlaanderen.be/ns/mandaat#Mandataris' &&
      ! loadedMandatarissen.some( (m) => m.uri === resource.subject) &&
      ! triples.some((t) => t.predicate === this.oudMandaatPredicate && t.object === resource.subject);
  }
});
