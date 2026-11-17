// Populated areas with good Street View coverage: "cc|Place|lat|lng"
const RAW = `
us|New York|40.71|-74.00
us|Los Angeles|34.05|-118.24
us|Chicago|41.88|-87.63
us|Houston|29.76|-95.37
us|Miami|25.76|-80.19
us|Seattle|47.61|-122.33
us|Denver|39.74|-104.99
us|New Orleans|29.95|-90.07
us|Nashville|36.16|-86.78
us|Phoenix|33.45|-112.07
us|Boston|42.36|-71.06
us|Honolulu|21.31|-157.86
us|Anchorage|61.22|-149.90
us|Santa Fe|35.69|-105.94
us|Savannah|32.08|-81.09
us|Minneapolis|44.98|-93.27
us|Salt Lake City|40.76|-111.89
us|Bozeman|45.68|-111.04
ca|Toronto|43.65|-79.38
ca|Vancouver|49.28|-123.12
ca|Montreal|45.50|-73.57
ca|Calgary|51.05|-114.07
ca|Halifax|44.65|-63.58
ca|Quebec City|46.81|-71.21
ca|Winnipeg|49.90|-97.14
mx|Mexico City|19.43|-99.13
mx|Guadalajara|20.67|-103.35
mx|Oaxaca|17.07|-96.72
mx|Merida|20.97|-89.62
mx|Monterrey|25.67|-100.31
mx|Tijuana|32.51|-117.04
gt|Antigua Guatemala|14.56|-90.73
cr|San Jose|9.93|-84.08
pa|Panama City|8.98|-79.52
do|Santo Domingo|18.47|-69.90
pr|San Juan|18.47|-66.11
co|Bogota|4.71|-74.07
co|Medellin|6.24|-75.58
co|Cartagena|10.39|-75.48
ec|Quito|-0.18|-78.47
pe|Lima|-12.05|-77.04
pe|Cusco|-13.53|-71.97
bo|La Paz|-16.49|-68.12
cl|Santiago|-33.45|-70.67
cl|Valparaiso|-33.05|-71.61
cl|Punta Arenas|-53.16|-70.91
ar|Buenos Aires|-34.60|-58.38
ar|Mendoza|-32.89|-68.84
ar|Cordoba|-31.42|-64.18
ar|Bariloche|-41.13|-71.31
ar|Ushuaia|-54.80|-68.30
uy|Montevideo|-34.90|-56.16
br|Sao Paulo|-23.55|-46.63
br|Rio de Janeiro|-22.91|-43.17
br|Salvador|-12.97|-38.50
br|Recife|-8.05|-34.88
br|Brasilia|-15.79|-47.88
br|Manaus|-3.12|-60.02
br|Porto Alegre|-30.03|-51.23
br|Belo Horizonte|-19.92|-43.94
br|Florianopolis|-27.59|-48.55
gb|London|51.51|-0.13
gb|Edinburgh|55.95|-3.19
gb|Manchester|53.48|-2.24
gb|Cardiff|51.48|-3.18
gb|Belfast|54.60|-5.93
gb|Inverness|57.48|-4.22
ie|Dublin|53.35|-6.26
ie|Galway|53.27|-9.05
fr|Paris|48.86|2.35
fr|Lyon|45.76|4.84
fr|Marseille|43.30|5.37
fr|Bordeaux|44.84|-0.58
fr|Strasbourg|48.57|7.75
fr|Nantes|47.22|-1.55
es|Madrid|40.42|-3.70
es|Barcelona|41.39|2.17
es|Seville|37.39|-5.98
es|Valencia|39.47|-0.38
es|Bilbao|43.26|-2.93
es|Las Palmas|28.12|-15.43
pt|Lisbon|38.72|-9.14
pt|Porto|41.15|-8.61
it|Rome|41.90|12.50
it|Milan|45.46|9.19
it|Naples|40.85|14.27
it|Florence|43.77|11.26
it|Palermo|38.12|13.36
it|Turin|45.07|7.69
de|Berlin|52.52|13.40
de|Munich|48.14|11.58
de|Hamburg|53.55|9.99
de|Cologne|50.94|6.96
nl|Amsterdam|52.37|4.90
nl|Rotterdam|51.92|4.48
be|Brussels|50.85|4.35
ch|Zurich|47.38|8.54
ch|Geneva|46.20|6.14
at|Vienna|48.21|16.37
at|Innsbruck|47.27|11.39
dk|Copenhagen|55.68|12.57
no|Oslo|59.91|10.75
no|Bergen|60.39|5.32
no|Tromso|69.65|18.96
se|Stockholm|59.33|18.07
se|Gothenburg|57.71|11.97
fi|Helsinki|60.17|24.94
fi|Rovaniemi|66.50|25.73
is|Reykjavik|64.15|-21.94
ee|Tallinn|59.44|24.75
lv|Riga|56.95|24.11
lt|Vilnius|54.69|25.28
pl|Warsaw|52.23|21.01
pl|Krakow|50.06|19.94
pl|Gdansk|54.35|18.65
cz|Prague|50.08|14.44
sk|Bratislava|48.15|17.11
hu|Budapest|47.50|19.04
ro|Bucharest|44.43|26.10
ro|Cluj-Napoca|46.77|23.60
bg|Sofia|42.70|23.32
gr|Athens|37.98|23.73
gr|Thessaloniki|40.64|22.94
hr|Zagreb|45.81|15.98
hr|Split|43.51|16.44
rs|Belgrade|44.79|20.45
si|Ljubljana|46.06|14.51
ua|Kyiv|50.45|30.52
ua|Lviv|49.84|24.03
tr|Istanbul|41.01|28.98
tr|Ankara|39.93|32.86
tr|Izmir|38.42|27.14
il|Tel Aviv|32.08|34.78
jo|Amman|31.95|35.93
ae|Dubai|25.20|55.27
za|Cape Town|-33.92|18.42
za|Johannesburg|-26.20|28.05
za|Durban|-29.86|31.03
bw|Gaborone|-24.65|25.91
ke|Nairobi|-1.29|36.82
ke|Mombasa|-4.04|39.67
ug|Kampala|0.35|32.58
tz|Arusha|-3.37|36.68
rw|Kigali|-1.95|30.06
ng|Lagos|6.52|3.38
ng|Abuja|9.08|7.40
gh|Accra|5.60|-0.19
sn|Dakar|14.72|-17.47
tn|Tunis|36.81|10.18
in|Mumbai|19.08|72.88
in|Delhi|28.61|77.21
in|Bengaluru|12.97|77.59
in|Kolkata|22.57|88.36
in|Chennai|13.08|80.27
in|Jaipur|26.91|75.79
in|Kochi|9.93|76.27
lk|Colombo|6.93|79.86
bd|Dhaka|23.81|90.41
th|Bangkok|13.76|100.50
th|Chiang Mai|18.79|98.99
th|Phuket|7.88|98.39
kh|Phnom Penh|11.56|104.92
my|Kuala Lumpur|3.14|101.69
my|George Town|5.41|100.33
sg|Singapore|1.35|103.82
id|Jakarta|-6.21|106.85
id|Yogyakarta|-7.80|110.37
id|Denpasar|-8.65|115.22
id|Surabaya|-7.26|112.75
ph|Manila|14.60|120.98
ph|Cebu City|10.32|123.89
tw|Taipei|25.03|121.57
tw|Kaohsiung|22.63|120.30
hk|Hong Kong|22.32|114.17
jp|Tokyo|35.68|139.69
jp|Osaka|34.69|135.50
jp|Kyoto|35.01|135.77
jp|Sapporo|43.06|141.35
jp|Fukuoka|33.59|130.40
jp|Naha|26.21|127.68
jp|Kanazawa|36.56|136.66
jp|Hiroshima|34.39|132.46
kr|Seoul|37.57|126.98
kr|Busan|35.18|129.08
kr|Jeju|33.50|126.53
mn|Ulaanbaatar|47.89|106.91
kg|Bishkek|42.87|74.59
kz|Almaty|43.24|76.89
au|Sydney|-33.87|151.21
au|Melbourne|-37.81|144.96
au|Brisbane|-27.47|153.03
au|Perth|-31.95|115.86
au|Adelaide|-34.93|138.60
au|Darwin|-12.46|130.84
au|Hobart|-42.88|147.33
au|Alice Springs|-23.70|133.88
nz|Auckland|-36.85|174.76
nz|Wellington|-41.29|174.78
nz|Christchurch|-43.53|172.64
nz|Queenstown|-45.03|168.66
`

export const SEEDS = RAW.trim().split('\n').map((line) => {
  const [cc, name, lat, lng] = line.split('|')
  return { cc, name, lat: +lat, lng: +lng }
})

export const REGIONS = ['North America', 'Latin America', 'Europe', 'Africa', 'Asia', 'Oceania']

const REGION_OF = {
  'North America': 'us ca',
  'Latin America': 'mx gt cr pa do pr co ec pe bo cl ar uy br',
  Europe: 'gb ie fr es pt it de nl be ch at dk no se fi is ee lv lt pl cz sk hu ro bg gr hr rs si ua',
  Africa: 'za bw ke ug tz rw ng gh sn tn',
  Asia: 'tr il jo ae in lk bd th kh my sg id ph tw hk jp kr mn kg kz',
  Oceania: 'au nz',
}

export function regionOf(cc) {
  for (const [region, list] of Object.entries(REGION_OF)) {
    if (list.split(' ').includes(cc)) return region
  }
  return 'Asia'
}

const names = typeof Intl !== 'undefined' && Intl.DisplayNames
  ? new Intl.DisplayNames(['en'], { type: 'region' })
  : null

export function countryName(cc) {
  try {
    return names ? names.of(cc.toUpperCase()) : cc.toUpperCase()
  } catch {
    return cc.toUpperCase()
  }
}
