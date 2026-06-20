const r32Mappings = [
  { id: 'r32_1', home: '1A', away: '3rd' }, // firsts['A'], thirds[0]
  { id: 'r32_2', home: '2B', away: '2C' }, // seconds['B'], seconds['C']
  { id: 'r32_3', home: '1C', away: '3rd' }, // firsts['C'], thirds[1]
  { id: 'r32_4', home: '2D', away: '2E' }, // seconds['D'], seconds['E']
  
  { id: 'r32_5', home: '1D', away: '3rd' }, // firsts['D'], thirds[2]
  { id: 'r32_6', home: '1E', away: '3rd' }, // firsts['E'], thirds[3]
  { id: 'r32_7', home: '1F', away: '2A' }, // firsts['F'], seconds['A']
  { id: 'r32_8', home: '2G', away: '2H' }, // seconds['G'], seconds['H']
  
  { id: 'r32_9', home: '1G', away: '3rd' }, // firsts['G'], thirds[4]
  { id: 'r32_10', home: '2I', away: '2J' }, // seconds['I'], seconds['J']
  { id: 'r32_11', home: '1H', away: '3rd' }, // firsts['H'], thirds[5]
  { id: 'r32_12', home: '2K', away: '2L' }, // seconds['K'], seconds['L']
  
  { id: 'r32_13', home: '1I', away: '3rd' }, // firsts['I'], thirds[6]
  { id: 'r32_14', home: '1J', away: '3rd' }, // firsts['J'], thirds[7]
  { id: 'r32_15', home: '1K', away: '2F' }, // firsts['K'], seconds['F']
  { id: 'r32_16', home: '1L', away: '2D' }, // firsts['L'], seconds['D']
];

// Let's print them
r32Mappings.forEach((m, idx) => {
  console.log(`${idx + 1}. App ID: ${m.id}, Matchup: ${m.home} vs ${m.away}`);
});
