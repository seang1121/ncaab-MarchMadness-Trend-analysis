import { HistoricalTournament } from "./backtest-types.js";

const r = (seeds: Record<number, string>, r64: string[], r32: string[], s16: string[], e8: string) =>
  ({ seeds, results: { r64, r32, s16, e8 } });

const T2011: HistoricalTournament = {
  year: 2011,
  regions: {
    East: r(
      {1:"Ohio State",2:"North Carolina",3:"Syracuse",4:"Kentucky",5:"West Virginia",6:"Xavier",7:"Washington",8:"George Mason",9:"Villanova",10:"Georgia",11:"Marquette",12:"Richmond",13:"Morehead State",14:"Indiana State",15:"Long Island",16:"Texas-San Antonio"},
      ["Ohio State","George Mason","West Virginia","Kentucky","Xavier","Syracuse","Washington","North Carolina"],
      ["Ohio State","Kentucky","Xavier","North Carolina"],
      ["Kentucky","North Carolina"],
      "Kentucky"
    ),
    West: r(
      {1:"Duke",2:"San Diego State",3:"Connecticut",4:"Louisville",5:"Arizona",6:"Cincinnati",7:"Temple",8:"Michigan",9:"Tennessee",10:"Penn State",11:"Missouri",12:"Colorado",13:"Oakland",14:"St. Peter's",15:"Northern Colorado",16:"Hampton"},
      ["Duke","Tennessee","Arizona","Louisville","Cincinnati","Connecticut","Temple","San Diego State"],
      ["Duke","Arizona","Connecticut","San Diego State"],
      ["Arizona","Connecticut"],
      "Connecticut"
    ),
    Southwest: r(
      {1:"Kansas",2:"Notre Dame",3:"Purdue",4:"Wisconsin",5:"Vanderbilt",6:"Georgetown",7:"Texas A&M",8:"UNLV",9:"Illinois",10:"Florida State",11:"Virginia Commonwealth",12:"Richmond",13:"Wofford",14:"Bucknell",15:"Northern Iowa",16:"Boston University"},
      ["Kansas","UNLV","Vanderbilt","Wisconsin","Virginia Commonwealth","Purdue","Texas A&M","Notre Dame"],
      ["Kansas","Wisconsin","Virginia Commonwealth","Notre Dame"],
      ["Kansas","Virginia Commonwealth"],
      "Virginia Commonwealth"
    ),
    Southeast: r(
      {1:"Pittsburgh",2:"Florida",3:"Brigham Young",4:"Wisconsin-Milwaukee",5:"Kansas State",6:"St. John's",7:"UCLA",8:"Butler",9:"Old Dominion",10:"Michigan State",11:"Gonzaga",12:"Utah State",13:"Belmont",14:"Akron",15:"UC Santa Barbara",16:"Alabama-Birmingham"},
      ["Pittsburgh","Butler","Kansas State","Wisconsin-Milwaukee","St. John's","Brigham Young","UCLA","Florida"],
      ["Butler","Wisconsin-Milwaukee","Brigham Young","Florida"],
      ["Butler","Florida"],
      "Butler"
    ),
  },
  regionOrder: ["West", "East", "Southwest", "Southeast"],
  finalFour: { semi1Winner: "Connecticut", semi2Winner: "Butler", champion: "Connecticut" },
};

const T2012: HistoricalTournament = {
  year: 2012,
  regions: {
    Midwest: r(
      {1:"North Carolina",2:"Kansas",3:"Georgetown",4:"Indiana",5:"Wichita State",6:"UNLV",7:"Notre Dame",8:"Creighton",9:"Alabama",10:"Xavier",11:"NC State",12:"South Florida",13:"Ohio",14:"Belmont",15:"Detroit",16:"Lamar"},
      ["North Carolina","Creighton","Wichita State","Indiana","UNLV","Georgetown","Xavier","Kansas"],
      ["North Carolina","Indiana","Georgetown","Kansas"],
      ["North Carolina","Kansas"],
      "Kansas"
    ),
    South: r(
      {1:"Kentucky",2:"Duke",3:"Baylor",4:"Indiana State",5:"Vanderbilt",6:"Murray State",7:"Notre Dame",8:"Iowa State",9:"Connecticut",10:"Virginia Tech",11:"Texas",12:"VCU",13:"Montana",14:"Loyola Maryland",15:"Detroit Mercy",16:"Mississippi Valley State"},
      ["Kentucky","Iowa State","Vanderbilt","Indiana State","Murray State","Baylor","Notre Dame","Duke"],
      ["Kentucky","Indiana State","Baylor","Duke"],
      ["Kentucky","Baylor"],
      "Kentucky"
    ),
    East: r(
      {1:"Syracuse",2:"Ohio State",3:"Florida State",4:"Wisconsin",5:"New Mexico",6:"Cincinnati",7:"Gonzaga",8:"Kansas State",9:"Southern Miss",10:"West Virginia",11:"Texas",12:"Long Beach State",13:"Montana",14:"St. Bonaventure",15:"UNC Asheville",16:"Vermont"},
      ["Syracuse","Kansas State","New Mexico","Wisconsin","Cincinnati","Florida State","Gonzaga","Ohio State"],
      ["Syracuse","Wisconsin","Cincinnati","Ohio State"],
      ["Syracuse","Ohio State"],
      "Ohio State"
    ),
    West: r(
      {1:"Michigan State",2:"Missouri",3:"Marquette",4:"Louisville",5:"New Mexico State",6:"Murray State",7:"Florida",8:"Memphis",9:"Saint Louis",10:"Purdue",11:"Colorado State",12:"Long Island",13:"Davidson",14:"Iona",15:"Norfolk State",16:"Savannah State"},
      ["Michigan State","Memphis","New Mexico State","Louisville","Murray State","Marquette","Florida","Norfolk State"],
      ["Louisville","New Mexico State","Marquette","Florida"],
      ["Louisville","Florida"],
      "Louisville"
    ),
  },
  regionOrder: ["South", "East", "Midwest", "West"],
  finalFour: { semi1Winner: "Kentucky", semi2Winner: "Kansas", champion: "Kentucky" },
};

const T2013: HistoricalTournament = {
  year: 2013,
  regions: {
    South: r(
      {1:"Kansas",2:"Georgetown",3:"Florida",4:"Michigan",5:"Virginia Commonwealth",6:"UCLA",7:"San Diego State",8:"North Carolina",9:"Villanova",10:"Oklahoma",11:"Minnesota",12:"Oregon",13:"Montana",14:"Northwestern State",15:"Florida Gulf Coast",16:"Western Kentucky"},
      ["Kansas","North Carolina","Virginia Commonwealth","Michigan","UCLA","Florida","San Diego State","Georgetown"],
      ["Kansas","Michigan","Florida","Georgetown"],
      ["Kansas","Michigan"],
      "Michigan"
    ),
    West: r(
      {1:"Gonzaga",2:"Ohio State",3:"New Mexico",4:"Kansas State",5:"Wisconsin",6:"Arizona",7:"Notre Dame",8:"Pittsburgh",9:"Wichita State",10:"Iowa State",11:"Bucknell",12:"Ole Miss",13:"South Dakota State",14:"Valparaiso",15:"Iona",16:"Southern"},
      ["Gonzaga","Wichita State","Wisconsin","Kansas State","Arizona","New Mexico","Notre Dame","Ohio State"],
      ["Wichita State","Kansas State","Arizona","Ohio State"],
      ["Wichita State","Ohio State"],
      "Wichita State"
    ),
    Midwest: r(
      {1:"Louisville",2:"Duke",3:"Michigan State",4:"Saint Louis",5:"Oklahoma State",6:"Memphis",7:"Creighton",8:"Colorado State",9:"Missouri",10:"Cincinnati",11:"Minnesota",12:"Oregon",13:"Valparaiso",14:"North Carolina A&T",15:"Albany",16:"North Carolina Central"},
      ["Louisville","Colorado State","Oklahoma State","Saint Louis","Memphis","Michigan State","Creighton","Duke"],
      ["Louisville","Saint Louis","Michigan State","Duke"],
      ["Louisville","Duke"],
      "Louisville"
    ),
    East: r(
      {1:"Indiana",2:"Miami FL",3:"Marquette",4:"Syracuse",5:"UNLV",6:"Butler",7:"Illinois",8:"North Carolina State",9:"Temple",10:"Colorado",11:"Minnesota",12:"California",13:"Montana",14:"Valparaiso",15:"James Madison",16:"Long Island"},
      ["Indiana","Temple","UNLV","Syracuse","Butler","Marquette","Illinois","Miami FL"],
      ["Indiana","Syracuse","Marquette","Miami FL"],
      ["Syracuse","Miami FL"],
      "Syracuse"
    ),
  },
  regionOrder: ["Midwest", "West", "South", "East"],
  finalFour: { semi1Winner: "Louisville", semi2Winner: "Michigan", champion: "Louisville" },
};

const T2014: HistoricalTournament = {
  year: 2014,
  regions: {
    East: r(
      {1:"Virginia",2:"Villanova",3:"Iowa State",4:"Michigan State",5:"Cincinnati",6:"North Carolina",7:"Connecticut",8:"Memphis",9:"George Washington",10:"Saint Joseph's",11:"Tennessee",12:"Stephen F. Austin",13:"Delaware",14:"NC Central",15:"American",16:"Coastal Carolina"},
      ["Virginia","Memphis","Cincinnati","Michigan State","North Carolina","Iowa State","Connecticut","Villanova"],
      ["Virginia","Michigan State","Iowa State","Connecticut"],
      ["Michigan State","Connecticut"],
      "Connecticut"
    ),
    South: r(
      {1:"Florida",2:"Kansas",3:"Syracuse",4:"UCLA",5:"Virginia Commonwealth",6:"Ohio State",7:"New Mexico",8:"Colorado",9:"Pittsburgh",10:"Stanford",11:"Dayton",12:"Stephen F. Austin",13:"Tulsa",14:"Western Michigan",15:"Eastern Kentucky",16:"Albany"},
      ["Florida","Pittsburgh","Virginia Commonwealth","UCLA","Dayton","Syracuse","New Mexico","Kansas"],
      ["Florida","UCLA","Dayton","Kansas"],
      ["Florida","Dayton"],
      "Florida"
    ),
    West: r(
      {1:"Arizona",2:"Wisconsin",3:"Creighton",4:"San Diego State",5:"Oklahoma",6:"Baylor",7:"Oregon",8:"Gonzaga",9:"Oklahoma State",10:"Brigham Young",11:"Nebraska",12:"North Dakota State",13:"New Mexico State",14:"Louisiana-Lafayette",15:"American",16:"Weber State"},
      ["Arizona","Gonzaga","Oklahoma","San Diego State","Baylor","Creighton","Oregon","Wisconsin"],
      ["Arizona","San Diego State","Baylor","Wisconsin"],
      ["Arizona","Wisconsin"],
      "Wisconsin"
    ),
    Midwest: r(
      {1:"Wichita State",2:"Michigan",3:"Duke",4:"Louisville",5:"Saint Louis",6:"North Carolina",7:"Connecticut",8:"Kentucky",9:"Kansas State",10:"Arizona State",11:"Tennessee",12:"Stephen F. Austin",13:"Manhattan",14:"Mercer",15:"Valparaiso",16:"Cal Poly"},
      ["Wichita State","Kentucky","Saint Louis","Louisville","Tennessee","Mercer","Connecticut","Michigan"],
      ["Kentucky","Louisville","Tennessee","Michigan"],
      ["Kentucky","Michigan"],
      "Kentucky"
    ),
  },
  regionOrder: ["East", "South", "West", "Midwest"],
  finalFour: { semi1Winner: "Connecticut", semi2Winner: "Kentucky", champion: "Connecticut" },
};

const T2015: HistoricalTournament = {
  year: 2015,
  regions: {
    South: r(
      {1:"Duke",2:"Gonzaga",3:"Iowa State",4:"Georgetown",5:"Utah",6:"SMU",7:"Michigan State",8:"San Diego State",9:"St. John's",10:"Davidson",11:"UCLA",12:"Stephen F. Austin",13:"Eastern Washington",14:"New Mexico State",15:"Robert Morris",16:"Coastal Carolina"},
      ["Duke","San Diego State","Utah","Georgetown","SMU","Iowa State","Michigan State","Gonzaga"],
      ["Duke","Utah","SMU","Gonzaga"],
      ["Duke","Gonzaga"],
      "Duke"
    ),
    East: r(
      {1:"Villanova",2:"Virginia",3:"Oklahoma",4:"Louisville",5:"Northern Iowa",6:"Providence",7:"Michigan State",8:"NC State",9:"LSU",10:"Georgia",11:"Dayton",12:"Wyoming",13:"UC Irvine",14:"Albany",15:"New Mexico State",16:"Lafayette"},
      ["Villanova","NC State","Northern Iowa","Louisville","Providence","Oklahoma","Michigan State","Virginia"],
      ["NC State","Louisville","Oklahoma","Michigan State"],
      ["Louisville","Michigan State"],
      "Michigan State"
    ),
    Midwest: r(
      {1:"Kentucky",2:"Kansas",3:"Notre Dame",4:"Maryland",5:"West Virginia",6:"Butler",7:"Wichita State",8:"Cincinnati",9:"Purdue",10:"Indiana",11:"Texas",12:"Buffalo",13:"Valparaiso",14:"Eastern Kentucky",15:"New Mexico State",16:"Manhattan"},
      ["Kentucky","Cincinnati","West Virginia","Maryland","Butler","Notre Dame","Wichita State","Kansas"],
      ["Kentucky","West Virginia","Notre Dame","Kansas"],
      ["Kentucky","Notre Dame"],
      "Kentucky"
    ),
    West: r(
      {1:"Wisconsin",2:"Arizona",3:"Baylor",4:"North Carolina",5:"Arkansas",6:"Xavier",7:"VCU",8:"Oregon",9:"Oklahoma State",10:"Ohio State",11:"Texas",12:"Wofford",13:"Harvard",14:"Georgia State",15:"Texas Southern",16:"Coastal Carolina"},
      ["Wisconsin","Oregon","Arkansas","North Carolina","Xavier","Baylor","VCU","Arizona"],
      ["Wisconsin","North Carolina","Xavier","Arizona"],
      ["Wisconsin","Arizona"],
      "Wisconsin"
    ),
  },
  regionOrder: ["South", "East", "Midwest", "West"],
  finalFour: { semi1Winner: "Duke", semi2Winner: "Wisconsin", champion: "Duke" },
};

export const TOURNAMENTS_2011_2015: HistoricalTournament[] = [T2011, T2012, T2013, T2014, T2015];
