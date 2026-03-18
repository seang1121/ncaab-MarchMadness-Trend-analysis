import { HistoricalTournament } from "./backtest-types.js";

const R = (seeds: Record<number, string>, r64: string[], r32: string[], s16: string[], e8: string) =>
  ({ seeds, results: { r64, r32, s16, e8 } });

const s = (pairs: [number, string][]): Record<number, string> => Object.fromEntries(pairs);

// 2016: Champion=Villanova, FF: Villanova/Oklahoma/North Carolina/Syracuse
// FF matchups: South(Villanova) vs West(Oklahoma), East(North Carolina) vs Midwest(Syracuse)
const T2016: HistoricalTournament = {
  year: 2016, regionOrder: ["South", "West", "East", "Midwest"],
  regions: {
    South: R(
      s([[1,"Kansas"],[2,"Villanova"],[3,"Miami FL"],[4,"California"],[5,"Maryland"],[6,"Arizona"],[7,"Iowa"],[8,"Colorado"],[9,"Connecticut"],[10,"Temple"],[11,"Wichita State"],[12,"South Dakota State"],[13,"Hawaii"],[14,"Buffalo"],[15,"Austin Peay"],[16,"UNC Asheville"]]),
      ["Kansas","Connecticut","Maryland","California","Arizona","Miami FL","Iowa","Villanova"],
      ["Kansas","Maryland","Miami FL","Villanova"],
      ["Kansas","Villanova"],
      "Villanova"
    ),
    East: R(
      s([[1,"North Carolina"],[2,"Xavier"],[3,"West Virginia"],[4,"Kentucky"],[5,"Indiana"],[6,"Notre Dame"],[7,"Wisconsin"],[8,"USC"],[9,"Providence"],[10,"Virginia Commonwealth"],[11,"Northern Iowa"],[12,"Chattanooga"],[13,"Stony Brook"],[14,"Stephen F. Austin"],[15,"Weber State"],[16,"Florida Gulf Coast"]]),
      ["North Carolina","Providence","Indiana","Kentucky","Notre Dame","West Virginia","Wisconsin","Xavier"],
      ["North Carolina","Indiana","Notre Dame","Wisconsin"],
      ["North Carolina","Notre Dame"],
      "North Carolina"
    ),
    West: R(
      s([[1,"Oregon"],[2,"Oklahoma"],[3,"Texas A&M"],[4,"Duke"],[5,"Baylor"],[6,"Texas"],[7,"Oregon State"],[8,"Saint Joseph's"],[9,"Cincinnati"],[10,"Pittsburgh"],[11,"Northern Iowa"],[12,"Yale"],[13,"Hawaii"],[14,"Green Bay"],[15,"Cal State Bakersfield"],[16,"Holy Cross"]]),
      ["Oregon","Saint Joseph's","Yale","Duke","Texas","Texas A&M","Pittsburgh","Oklahoma"],
      ["Oregon","Duke","Texas A&M","Oklahoma"],
      ["Oregon","Oklahoma"],
      "Oklahoma"
    ),
    Midwest: R(
      s([[1,"Virginia"],[2,"Michigan State"],[3,"Utah"],[4,"Iowa State"],[5,"Purdue"],[6,"Seton Hall"],[7,"Dayton"],[8,"Texas Tech"],[9,"Butler"],[10,"Syracuse"],[11,"Gonzaga"],[12,"Little Rock"],[13,"Iona"],[14,"Fresno State"],[15,"Middle Tennessee"],[16,"Hampton"]]),
      ["Virginia","Butler","Purdue","Iowa State","Gonzaga","Utah","Syracuse","Middle Tennessee"],
      ["Virginia","Iowa State","Gonzaga","Syracuse"],
      ["Virginia","Syracuse"],
      "Syracuse"
    ),
  },
  finalFour: { semi1Winner: "Villanova", semi2Winner: "North Carolina", champion: "Villanova" },
};

// 2017: Champion=North Carolina, FF: Gonzaga/South Carolina/Oregon/North Carolina
// FF matchups: West(Gonzaga) vs East(South Carolina), Midwest(Oregon) vs South(North Carolina)
const T2017: HistoricalTournament = {
  year: 2017, regionOrder: ["West", "East", "Midwest", "South"],
  regions: {
    East: R(
      s([[1,"Villanova"],[2,"Duke"],[3,"Baylor"],[4,"Florida"],[5,"Virginia"],[6,"Southern Methodist"],[7,"South Carolina"],[8,"Wisconsin"],[9,"Virginia Tech"],[10,"Marquette"],[11,"USC"],[12,"Middle Tennessee"],[13,"East Tennessee State"],[14,"New Mexico State"],[15,"Troy"],[16,"Mount St. Mary's"]]),
      ["Villanova","Wisconsin","Virginia","Florida","Southern Methodist","Baylor","South Carolina","Duke"],
      ["Wisconsin","Florida","Baylor","South Carolina"],
      ["Florida","South Carolina"],
      "South Carolina"
    ),
    West: R(
      s([[1,"Gonzaga"],[2,"Arizona"],[3,"Florida State"],[4,"West Virginia"],[5,"Notre Dame"],[6,"Maryland"],[7,"Saint Mary's"],[8,"Northwestern"],[9,"Vanderbilt"],[10,"VCU"],[11,"Xavier"],[12,"Princeton"],[13,"Bucknell"],[14,"Florida Gulf Coast"],[15,"North Dakota"],[16,"South Dakota State"]]),
      ["Gonzaga","Northwestern","Notre Dame","West Virginia","Maryland","Florida State","Saint Mary's","Arizona"],
      ["Gonzaga","West Virginia","Florida State","Arizona"],
      ["Gonzaga","Arizona"],
      "Gonzaga"
    ),
    Midwest: R(
      s([[1,"Kansas"],[2,"Louisville"],[3,"Oregon"],[4,"Purdue"],[5,"Iowa State"],[6,"Creighton"],[7,"Michigan"],[8,"Miami FL"],[9,"Michigan State"],[10,"Oklahoma State"],[11,"Rhode Island"],[12,"Nevada"],[13,"Vermont"],[14,"Iona"],[15,"Jacksonville State"],[16,"UC Davis"]]),
      ["Kansas","Michigan State","Iowa State","Purdue","Oregon","Rhode Island","Michigan","Louisville"],
      ["Kansas","Purdue","Oregon","Michigan"],
      ["Kansas","Oregon"],
      "Oregon"
    ),
    South: R(
      s([[1,"North Carolina"],[2,"Kentucky"],[3,"UCLA"],[4,"Butler"],[5,"Minnesota"],[6,"Cincinnati"],[7,"Dayton"],[8,"Arkansas"],[9,"Seton Hall"],[10,"Wichita State"],[11,"Kansas State"],[12,"Middle Tennessee"],[13,"Winthrop"],[14,"Kent State"],[15,"Northern Kentucky"],[16,"Texas Southern"]]),
      ["North Carolina","Arkansas","Minnesota","Butler","Cincinnati","UCLA","Wichita State","Kentucky"],
      ["North Carolina","Butler","UCLA","Kentucky"],
      ["North Carolina","Kentucky"],
      "North Carolina"
    ),
  },
  finalFour: { semi1Winner: "Gonzaga", semi2Winner: "North Carolina", champion: "North Carolina" },
};

// 2018: Champion=Villanova, FF: Villanova/Kansas/Loyola Chicago/Michigan
// FF matchups: East(Villanova) vs Midwest(Kansas), South(Loyola Chicago) vs West(Michigan)
const T2018: HistoricalTournament = {
  year: 2018, regionOrder: ["East", "Midwest", "South", "West"],
  regions: {
    East: R(
      s([[1,"Villanova"],[2,"Purdue"],[3,"Texas Tech"],[4,"Wichita State"],[5,"West Virginia"],[6,"Florida"],[7,"Texas A&M"],[8,"Virginia Tech"],[9,"Alabama"],[10,"Butler"],[11,"St. Bonaventure"],[12,"Murray State"],[13,"Marshall"],[14,"Stephen F. Austin"],[15,"Cal State Fullerton"],[16,"Radford"]]),
      ["Villanova","Alabama","West Virginia","Wichita State","Florida","Texas Tech","Texas A&M","Purdue"],
      ["Villanova","West Virginia","Texas Tech","Purdue"],
      ["Villanova","Texas Tech"],
      "Villanova"
    ),
    South: R(
      s([[1,"Virginia"],[2,"Cincinnati"],[3,"Tennessee"],[4,"Arizona"],[5,"Kentucky"],[6,"Miami FL"],[7,"Nevada"],[8,"Creighton"],[9,"Kansas State"],[10,"Texas"],[11,"Loyola Chicago"],[12,"Davidson"],[13,"Buffalo"],[14,"Wright State"],[15,"Georgia State"],[16,"UMBC"]]),
      ["UMBC","Kansas State","Kentucky","Buffalo","Loyola Chicago","Tennessee","Nevada","Cincinnati"],
      ["Kansas State","Kentucky","Loyola Chicago","Nevada"],
      ["Kansas State","Loyola Chicago"],
      "Loyola Chicago"
    ),
    West: R(
      s([[1,"Xavier"],[2,"North Carolina"],[3,"Michigan"],[4,"Gonzaga"],[5,"Ohio State"],[6,"Houston"],[7,"Texas A&M"],[8,"Missouri"],[9,"Florida State"],[10,"Providence"],[11,"San Diego State"],[12,"South Dakota State"],[13,"UNC Greensboro"],[14,"Georgia State"],[15,"Lipscomb"],[16,"Texas Southern"]]),
      ["Xavier","Missouri","Ohio State","Gonzaga","Houston","Michigan","Texas A&M","North Carolina"],
      ["Xavier","Gonzaga","Michigan","Texas A&M"],
      ["Gonzaga","Michigan"],
      "Michigan"
    ),
    Midwest: R(
      s([[1,"Kansas"],[2,"Duke"],[3,"Michigan State"],[4,"Auburn"],[5,"Clemson"],[6,"TCU"],[7,"Rhode Island"],[8,"Seton Hall"],[9,"North Carolina State"],[10,"Oklahoma"],[11,"Syracuse"],[12,"New Mexico State"],[13,"Charleston"],[14,"Bucknell"],[15,"Iona"],[16,"Penn"]]),
      ["Kansas","Seton Hall","Clemson","Auburn","Syracuse","Michigan State","Rhode Island","Duke"],
      ["Kansas","Auburn","Syracuse","Duke"],
      ["Kansas","Duke"],
      "Kansas"
    ),
  },
  finalFour: { semi1Winner: "Villanova", semi2Winner: "Michigan", champion: "Villanova" },
};

// 2019: Champion=Virginia, FF: Virginia/Auburn/Michigan State/Texas Tech
// FF matchups: South(Virginia) vs Midwest(Auburn), East(Michigan State) vs West(Texas Tech)
const T2019: HistoricalTournament = {
  year: 2019, regionOrder: ["South", "Midwest", "East", "West"],
  regions: {
    South: R(
      s([[1,"Virginia"],[2,"Tennessee"],[3,"Purdue"],[4,"Kansas State"],[5,"Wisconsin"],[6,"Villanova"],[7,"Cincinnati"],[8,"Mississippi"],[9,"Oklahoma"],[10,"Iowa"],[11,"Oregon"],[12,"Liberty"],[13,"UC Irvine"],[14,"Old Dominion"],[15,"Colgate"],[16,"Gardner-Webb"]]),
      ["Virginia","Oklahoma","Oregon","Kansas State","Villanova","Purdue","Cincinnati","Tennessee"],
      ["Virginia","Oregon","Purdue","Tennessee"],
      ["Virginia","Purdue"],
      "Virginia"
    ),
    East: R(
      s([[1,"Duke"],[2,"Michigan State"],[3,"LSU"],[4,"Virginia Tech"],[5,"Mississippi State"],[6,"Maryland"],[7,"Louisville"],[8,"Virginia Commonwealth"],[9,"Central Florida"],[10,"Minnesota"],[11,"Belmont"],[12,"Murray State"],[13,"Vermont"],[14,"Yale"],[15,"Bradley"],[16,"North Carolina Central"]]),
      ["Duke","Central Florida","Mississippi State","Virginia Tech","Maryland","LSU","Minnesota","Michigan State"],
      ["Duke","Virginia Tech","LSU","Michigan State"],
      ["Duke","Michigan State"],
      "Michigan State"
    ),
    West: R(
      s([[1,"Gonzaga"],[2,"Michigan"],[3,"Texas Tech"],[4,"Florida State"],[5,"Marquette"],[6,"Buffalo"],[7,"Nevada"],[8,"Syracuse"],[9,"Baylor"],[10,"Florida"],[11,"Arizona State"],[12,"Murray State"],[13,"Vermont"],[14,"Northern Kentucky"],[15,"Montana"],[16,"Fairleigh Dickinson"]]),
      ["Gonzaga","Baylor","Marquette","Florida State","Buffalo","Texas Tech","Florida","Michigan"],
      ["Gonzaga","Florida State","Texas Tech","Michigan"],
      ["Gonzaga","Texas Tech"],
      "Texas Tech"
    ),
    Midwest: R(
      s([[1,"North Carolina"],[2,"Kentucky"],[3,"Houston"],[4,"Kansas"],[5,"Auburn"],[6,"Iowa State"],[7,"Wofford"],[8,"Utah State"],[9,"Washington"],[10,"Seton Hall"],[11,"Ohio State"],[12,"New Mexico State"],[13,"Northeastern"],[14,"Georgia State"],[15,"Abilene Christian"],[16,"Iona"]]),
      ["North Carolina","Washington","Auburn","Kansas","Iowa State","Houston","Wofford","Kentucky"],
      ["North Carolina","Auburn","Houston","Kentucky"],
      ["North Carolina","Auburn"],
      "Auburn"
    ),
  },
  finalFour: { semi1Winner: "Virginia", semi2Winner: "Texas Tech", champion: "Virginia" },
};

export const TOURNAMENTS_2016_2019: HistoricalTournament[] = [T2016, T2017, T2018, T2019];
