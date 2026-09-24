/** A beslutsformulering as the Beslut tab has always offered it: kategori, rubrik and text. */
export interface DefaultDecisionPhrase {
  category: string;
  name: string;
  /** Plain text; each line becomes a paragraph. `¤` = sökandes namn, `¥` = belopp, `※` = period. */
  text: string;
}

/**
 * The beslutsformuleringar the Beslut tab offered before they moved to Templating. The admin page puts them
 * there once ("Lägg in standardfraserna"); from then on they are edited in Templating, not here.
 */
export const DEFAULT_DECISION_PHRASES: DefaultDecisionPhrase[] = [
  {
    category: 'Ek bistånd Bifall MÅNAD PERIOD ÄNDAMÅL',
    name: 'Bifall månad',
    text: 'Ni har gjort vad ni kan för att bidra till er försörjning inför aktuell period utifrån era förutsättningar och förmågor samt saknar tillräckliga inkomster för att klara försörjningen.\nEkonomiskt bistånd beviljas med ¥ kronor för ※, se beräkning. Biståndet utbetalas enligt angivet utbetalningssätt.',
  },
  {
    category: 'Ek bistånd Bifall MÅNAD PERIOD ÄNDAMÅL',
    name: 'Bifall månad MED BARN',
    text: 'Ni har gjort vad ni kan för att bidra till er försörjning inför aktuell period utifrån era förutsättningar och förmågor samt saknar tillräckliga inkomster för att klara försörjningen. Barn har rätt till den levnadsstandard som krävs för bland annat barnets fysiska, psykiska och sociala utveckling. Tillräckliga inkomster för att säkerställa skälig levnadsnivå för barn i familjen saknas.\nEkonomiskt bistånd beviljas med ¥ kronor för ※, se beräkning. Biståndet utbetalas enligt angivet utbetalningssätt.',
  },
  {
    category: 'Ek bistånd Bifall MÅNAD PERIOD ÄNDAMÅL',
    name: 'Bifall månad period ändamål 12:2',
    text: 'Ansökan har prövats enligt 12 kap. 1 § socialtjänstlagen, se avslagsbeslut ÅÅÅÅ-MM-DD. Ansökan har därefter prövats enligt 12 kap. 2 § socialtjänstlagen och det bedöms finnas skäl för att bevilja ekonomiskt bistånd. SKRIVMOTERIVERINGHÄR.\nEkonomiskt bistånd beviljas till XX med ¥ kronor för ※. Biståndet utbetalas enligt angivet utbetalningssätt.',
  },
  {
    category: 'Ek bistånd Bifall MÅNAD PERIOD ÄNDAMÅL',
    name: 'Bifall månad period ändamål 12:2 MED BARN',
    text: 'Ansökan har prövats enligt 12 kap. 1 § socialtjänstlagen, se avslagsbeslut ÅÅÅÅ-MM-DD. Ansökan har därefter prövats enligt 12 kap. 2 § socialtjänstlagen och det bedöms finnas skäl för att bevilja ekonomiskt bistånd. SKRIVMOTERIVERINGHÄR. Barn har rätt till den levnadsstandard som krävs för bland annat barnets fysiska, psykiska och sociala utveckling. Tillräckliga inkomster för att säkerställa skälig levnadsnivå för barn i familjen saknas.\nEkonomiskt bistånd beviljas till XX med ¥ kronor för ※. Biståndet utbetalas enligt angivet utbetalningssätt.',
  },
  {
    category: 'Ek bistånd Avslag DELVIS ÄNDAMÅL',
    name: 'Avslag begravning delvis EJ SKÄLIGA POSTER',
    text: 'Ansökan om kostnad till begravning med ¥ kronor avslås med ¥ kr för ※. Aktuella poster bedöms inte vara nödvändiga för att ha en värdig begravning. Behovet av en skälig och värdig begravning bedöms vara tillgodosett genom beviljat bistånd för ändamålet. Det saknas särskilda skäl för att göra en annan bedömning.\n\nFöljande poster bedöms inte vara nödvändiga:\n- XX',
  },
  {
    category: 'Ek bistånd Avslag DELVIS ÄNDAMÅL',
    name: 'Avslag begravning delvis FÖR HÖG KOSTNAD',
    text: 'Ansökan om kostnad till begravning med ¥ kronor avslås med ¥ kr för ※. Beviljat bistånd till begravning bedöms vara tillräckligt för att ha en skälig och värdig begravning. Det saknas särskilda skäl för att göra en annan bedömning.',
  },
  {
    category: 'Ek bistånd Avslag DELVIS ÄNDAMÅL',
    name: 'Avslag boendekostnader delvis DELA KOSTNADER',
    text: 'Ansökan om kostnad till ÄNDAMÅL med ¥ kronor avslås med ¥ kronor för ※. Ni bor flera i bostaden och har ett gemensamt ansvar att dela på kostnaderna för gemensamma utgifter. Skälig levnadsnivå bedöms vara tillgodosett genom beviljat bistånd för perioden. Det saknas särskilda skäl för att göra en annan bedömning.',
  },
  {
    category: 'Ek bistånd Avslag DELVIS ÄNDAMÅL',
    name: 'Avslag hemförsäkring delvis FÖR HÖG KOSTNAD',
    text: 'Ansökan om kostnad till hemförsäkring med ¥ kronor avslås med ¥ kronor för ※. Beviljat bistånd till hemförsäkring bedöms vara tillräckligt för att kunna ha ett grundläggande försäkringsskydd utifrån antal personer i ärendet. Skälig levnadsnivå bedöms vara tillgodosett genom beviljat bistånd för perioden. Det saknas särskilda skäl för att göra en annan bedömning.',
  },
  {
    category: 'Ek bistånd Avslag DELVIS ÄNDAMÅL',
    name: 'Avslag hemutrustn delvis EJ NÖDVÄNDIG/ HÖG KOSTNAD',
    text: 'Ansökan om ekonomiskt bistånd till hemutrustning avslås delvis för ※.\n\nFöljande hemutrustning bedöms inte vara nödvändig för att tillförsäkras en skälig levnadsnivå:\n- XX\n\nKostnad för följande hemutrustning överstiger vad en låginkomsttagare på orten normalt har råd med:\n- XX\n\nBeviljat bistånd till hemutrustning bedöms vara tillräckligt för att täcka de grundläggande behoven av sömn, matlagning, umgänge och rengöring i ett hem. Skälig levnadsnivå bedöms vara tillgodosett genom beviljat bistånd för perioden. Det saknas särskilda skäl för att göra en annan bedömning.',
  },
  {
    category: 'Ek bistånd Avslag DELVIS ÄNDAMÅL',
    name: 'Avslag hyra delvis FÖR HÖG KOSTNAD',
    text: 'Ansökan om kostnad till hyra med ¥ kronor avslås med ¥ kronor för ※. Ni har haft skälig tid på er att sänka boendekostnaden utifrån tidigare beslut om rådrum. Beviljat bistånd till hyra bedöms vara tillräckligt för att tillgodose behovet av boende utifrån antal personer i ärendet och boendets storlek. Kostnaden överstiger vad en låginkomsttagare på orten normalt har råd med. Skälig levnadsnivå bedöms vara tillgodosett genom beviljat bistånd för perioden. Det saknas särskilda skäl för att göra en annan bedömning.',
  },
];
