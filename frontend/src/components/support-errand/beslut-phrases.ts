/**
 * Unique placeholder characters in a phrase that map to errand data. NAME is replaced with the sökande's
 * name on insert; AMOUNT (belopp) and PERIOD (MÅNADÅR) are left in place for now and will be mapped from
 * the beräkning later.
 */
export const NAME_PLACEHOLDER = '¤';
export const AMOUNT_PLACEHOLDER = '§';
export const PERIOD_PLACEHOLDER = '※';

export interface BeslutPhrase {
  id: string;
  /** The heading (rubrik), shown and searchable in the second combobox. */
  name: string;
  /** The phrase body; placeholder characters are substituted on insert (see the constants above). */
  text: string;
}

export interface BeslutPhraseGroup {
  id: string;
  /** The category, shown and searchable in the first combobox. */
  name: string;
  phrases: BeslutPhrase[];
}

/**
 * Example decision-message phrases (frastexter), kept in the frontend for now. Two levels: a category
 * (first combobox) holding the headings (second combobox). `¤` = sökandes namn, `§` = belopp, `※` = period.
 */
export const BESLUT_PHRASE_GROUPS: BeslutPhraseGroup[] = [
  {
    id: 'avslag-delvis-andamal',
    name: 'Ek bistånd Avslag DELVIS ÄNDAMÅL',
    phrases: [
      {
        id: 'begravning-ej-skaliga',
        name: 'Avslag begravning delvis EJ SKÄLIGA POSTER',
        text: 'Ansökan om kostnad till begravning med § kronor avslås med § kr för ※. Aktuella poster bedöms inte vara nödvändiga för att ha en värdig begravning. Behovet av en skälig och värdig begravning bedöms vara tillgodosett genom beviljat bistånd för ändamålet. Det saknas särskilda skäl för att göra en annan bedömning.\n\nFöljande poster bedöms inte vara nödvändiga:\n- XX',
      },
      {
        id: 'begravning-hog-kostnad',
        name: 'Avslag begravning delvis FÖR HÖG KOSTNAD',
        text: 'Ansökan om kostnad till begravning med § kronor avslås med § kr för ※. Beviljat bistånd till begravning bedöms vara tillräckligt för att ha en skälig och värdig begravning. Det saknas särskilda skäl för att göra en annan bedömning.',
      },
      {
        id: 'boende-dela-kostnader',
        name: 'Avslag boendekostnader delvis DELA KOSTNADER',
        text: 'Ansökan om kostnad till ÄNDAMÅL med § kronor avslås med § kronor för ※. Ni bor flera i bostaden och har ett gemensamt ansvar att dela på kostnaderna för gemensamma utgifter. Skälig levnadsnivå bedöms vara tillgodosett genom beviljat bistånd för perioden. Det saknas särskilda skäl för att göra en annan bedömning.',
      },
      {
        id: 'hemforsakring-hog-kostnad',
        name: 'Avslag hemförsäkring delvis FÖR HÖG KOSTNAD',
        text: 'Ansökan om kostnad till hemförsäkring med § kronor avslås med § kronor för ※. Beviljat bistånd till hemförsäkring bedöms vara tillräckligt för att kunna ha ett grundläggande försäkringsskydd utifrån antal personer i ärendet. Skälig levnadsnivå bedöms vara tillgodosett genom beviljat bistånd för perioden. Det saknas särskilda skäl för att göra en annan bedömning.',
      },
      {
        id: 'hemutrustning-ej-nodvandig',
        name: 'Avslag hemutrustn delvis EJ NÖDVÄNDIG/ HÖG KOSTNAD',
        text: 'Ansökan om ekonomiskt bistånd till hemutrustning avslås delvis för ※.\n\nFöljande hemutrustning bedöms inte vara nödvändig för att tillförsäkras en skälig levnadsnivå:\n- XX\n\nKostnad för följande hemutrustning överstiger vad en låginkomsttagare på orten normalt har råd med:\n- XX\n\nBeviljat bistånd till hemutrustning bedöms vara tillräckligt för att täcka de grundläggande behoven av sömn, matlagning, umgänge och rengöring i ett hem. Skälig levnadsnivå bedöms vara tillgodosett genom beviljat bistånd för perioden. Det saknas särskilda skäl för att göra en annan bedömning.',
      },
      {
        id: 'hyra-hog-kostnad',
        name: 'Avslag hyra delvis FÖR HÖG KOSTNAD',
        text: 'Ansökan om kostnad till hyra med § kronor avslås med § kronor för ※. Ni har haft skälig tid på er att sänka boendekostnaden utifrån tidigare beslut om rådrum. Beviljat bistånd till hyra bedöms vara tillräckligt för att tillgodose behovet av boende utifrån antal personer i ärendet och boendets storlek. Kostnaden överstiger vad en låginkomsttagare på orten normalt har råd med. Skälig levnadsnivå bedöms vara tillgodosett genom beviljat bistånd för perioden. Det saknas särskilda skäl för att göra en annan bedömning.',
      },
    ],
  },
  {
    id: 'allmant',
    name: 'Allmänt',
    phrases: [
      {
        id: 'bifall',
        name: 'Bifall',
        text: '¤ beviljas ekonomiskt bistånd enligt ansökan för ※.',
      },
      {
        id: 'avslag-inkomst',
        name: 'Avslag – inkomst över norm',
        text: '¤s inkomster och tillgångar överstiger riksnormen och skäliga kostnader för ※. Ansökan om ekonomiskt bistånd avslås därför.',
      },
      {
        id: 'komplettering',
        name: 'Begäran om komplettering',
        text: 'För att kunna pröva ¤s ansökan behöver vi kompletterande uppgifter. Vänligen kontakta din handläggare.',
      },
      {
        id: 'overklagande',
        name: 'Information om överklagande',
        text: 'Om ¤ är missnöjd med beslutet kan det överklagas. Överklagandet ska ha kommit in inom tre veckor från den dag ¤ tog del av beslutet.',
      },
    ],
  },
];
