const url = "https://barttorvik.com/teamslicejson.php?year=2025&json=1&type=pointed";

async function main() {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  const data = (await res.json()) as unknown[][];
  console.log(`Total teams: ${data.length}, Row length: ${data[0]?.length}`);

  // Find Duke
  const duke = data.find((r) => String(r[0]).includes("Duke"));
  if (duke) {
    console.log("\nDuke full row:");
    duke.forEach((v, i) => console.log(`  [${i}] ${JSON.stringify(v)}`));
  }

  // Top 3 by adjEM
  const sorted = [...data].sort((a, b) => (Number(b[1]) - Number(b[2])) - (Number(a[1]) - Number(a[2])));
  console.log("\nTop 5 by adjEM:");
  for (const row of sorted.slice(0, 5)) {
    const name = row[0];
    const adjOE = Number(row[1]).toFixed(1);
    const adjDE = Number(row[2]).toFixed(1);
    const adjEM = (Number(row[1]) - Number(row[2])).toFixed(1);
    console.log(`  ${name}: adjOE=${adjOE} adjDE=${adjDE} adjEM=${adjEM} idx3=${row[3]} idx11=${row[11]} idx19=${row[19]} idx26=${row[26]} idx36=${row[36]} idx37=${row[37]}`);
  }
}

main().then(() => process.exit(0));
