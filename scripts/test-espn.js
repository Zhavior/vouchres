async function test() {
  const res = await fetch("https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard");
  const data = await res.json();
  const events = data.events;
  for (const event of events) {
    console.log(event.name, event.id, event.status.type.completed);
  }
}
test();
