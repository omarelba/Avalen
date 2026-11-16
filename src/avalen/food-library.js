// Food library: the starter foods plus everyday Egyptian dishes and staples.
// Values are typical, home-style estimates per stated portion. Packaged
// supermarket products come from their barcode instead (Open Food Facts).
import { FOODS } from './seed.js';
import { translateExact } from './i18n.js';

const egypt = (name, ar, portion, kcal, p, c, f, tags = '') => ({ name, ar, portion, kcal, p, c, f, tags, source: 'Typical values' });

export const EGYPT_FOODS = [
  egypt('Baladi bread', 'عيش بلدي', '1 loaf · 100 g', 250, 9, 52, 1, 'aish eish pita'),
  egypt('Fino bread roll', 'عيش فينو', '1 roll · 70 g', 190, 6, 37, 2, 'feno'),
  egypt('Ful medames with oil', 'فول مدمس', '1 cup · 250 g', 395, 19, 49, 15, 'foul fava beans'),
  egypt('Ful medames, plain', 'فول مدمس سادة', '1 cup · 250 g', 275, 19, 49, 1, 'foul fava beans'),
  egypt('Ta’meya', 'طعمية', '1 piece · 30 g', 100, 4, 10, 5, 'tameya taameya falafel'),
  egypt('Koshari', 'كشري', '1 plate · 400 g', 640, 20, 115, 12, 'koshary kushari'),
  egypt('Molokhia', 'ملوخية', '1 bowl · 250 g', 120, 5, 8, 8, 'molokheya mulukhiyah'),
  egypt('Mahshi', 'محشي', '5 pieces · 150 g', 230, 4, 32, 10, 'stuffed vine leaves wara enab'),
  egypt('Rice with vermicelli', 'رز بالشعرية', '1 cup · 160 g', 230, 4, 42, 5, 'roz rice'),
  egypt('Macarona béchamel', 'مكرونة بشاميل', '1 slice · 200 g', 420, 18, 38, 21, 'macaroni bechamel pasta'),
  egypt('Lentil soup', 'شوربة عدس', '1 bowl · 250 g', 180, 10, 28, 3, 'shorbet ads'),
  egypt('Grilled kofta', 'كفتة مشوية', '4 pieces · 120 g', 300, 22, 3, 22, 'kofta kebab'),
  egypt('Shish tawook', 'شيش طاووق', '2 skewers · 200 g', 330, 50, 4, 12, 'chicken skewers'),
  egypt('Chicken shawarma sandwich', 'ساندوتش شاورما فراخ', '1 sandwich · 200 g', 450, 25, 45, 18, 'shawerma'),
  egypt('Hawawshi', 'حواوشي', '1 loaf · 250 g', 600, 28, 50, 32, 'hawawshy'),
  egypt('Alexandrian liver sandwich', 'ساندوتش كبدة', '1 sandwich · 150 g', 380, 20, 40, 15, 'kebda'),
  egypt('Fried eggplant', 'بتنجان مقلي', '3 slices · 100 g', 180, 2, 9, 16, 'betengan aubergine'),
  egypt('Feteer meshaltet', 'فطير مشلتت', '1 slice · 100 g', 400, 7, 40, 24, 'fetir'),
  egypt('White cheese (Domiati)', 'جبنة بيضاء', '2 tbsp · 30 g', 80, 4, 1, 6, 'gebna domty feta'),
  egypt('Roumi cheese', 'جبنة رومي', '1 slice · 30 g', 115, 8, 0, 9, 'gebna romy'),
  egypt('Labneh', 'لبنة', '2 tbsp · 30 g', 50, 2, 1, 4.5, 'labna'),
  egypt('Plain yogurt', 'زبادي', '1 cup · 105 g', 65, 4, 5, 3, 'zabadi'),
  egypt('Full-fat milk', 'لبن كامل الدسم', '1 cup · 240 ml', 150, 8, 12, 8, 'laban'),
  egypt('Skimmed milk', 'لبن خالي الدسم', '1 cup · 240 ml', 85, 8, 12, 0, 'laban'),
  egypt('Tahini', 'طحينة', '1 tbsp · 15 g', 89, 2.5, 3, 8, 'tahina'),
  egypt('Hummus', 'حمص', '2 tbsp · 30 g', 50, 2.4, 4, 3, 'homos'),
  egypt('Baba ghanoush', 'بابا غنوج', '2 tbsp · 60 g', 80, 1.5, 5, 6, 'baba ghanough'),
  egypt('Halawa tahiniya', 'حلاوة طحينية', '2 tbsp · 30 g', 160, 4, 15, 9.5, 'halva halawa'),
  egypt('Canned tuna in water', 'تونة مياه', '1 can drained · 120 g', 130, 29, 0, 1, 'tuna'),
  egypt('Canned tuna in oil', 'تونة زيت', '1 can drained · 120 g', 240, 30, 0, 13, 'tuna'),
  egypt('Dates', 'بلح', '3 dates · 24 g', 70, 0.6, 18, 0, 'balah tamr'),
  egypt('Guava', 'جوافة', '1 piece · 100 g', 68, 2.6, 14, 1, 'gawafa'),
  egypt('Mango', 'مانجو', '1 cup · 165 g', 99, 1.4, 25, 0.6, 'manga'),
  egypt('Sugarcane juice', 'عصير قصب', '1 glass · 250 ml', 180, 0, 45, 0, 'asab'),
  egypt('Sahlab', 'سحلب', '1 cup · 250 ml', 230, 8, 35, 7, 'sahlep'),
  egypt('Tea with sugar', 'شاي بسكر', '1 cup · 240 ml', 32, 0, 8, 0, 'shai chai'),
  egypt('Basbousa', 'بسبوسة', '1 piece · 60 g', 230, 3, 35, 9, 'basbosa'),
  egypt('Konafa', 'كنافة', '1 piece · 80 g', 300, 4, 38, 15, 'kunafa kanafeh'),
  egypt('Om Ali', 'أم علي', '1 bowl · 200 g', 450, 10, 50, 23, 'umm ali'),
];

// Everyday foods: proteins, carbohydrates, fruit, vegetables, fats, dairy, drinks, more
// Egyptian dishes, common fast food and snacks. Typical values per stated portion
// (cooked weights where cooked).
const food = (name, ar, portion, kcal, p, c, f, tags = '') => ({ name, ar, portion, kcal, p, c, f, tags, source: 'Typical values' });
export const EVERYDAY_FOODS = [
  food("Grilled chicken thigh", "ورك فراخ مشوي", "1 piece · 120 g", 250, 31, 0, 14, "chicken thigh frakh"),
  food("Boiled chicken breast", "صدر فراخ مسلوق", "1 fillet · 150 g", 230, 45, 0, 5, "chicken breast frakh"),
  food("Roast chicken, quarter with skin", "ربع فرخة مشوية", "1 piece · 250 g", 560, 55, 0, 37, "rotisserie chicken frakh"),
  food("Turkey breast slices", "شرائح صدر رومي", "3 slices · 60 g", 65, 12, 1, 1, "turkey deli"),
  food("Lean beef mince, cooked", "لحم مفروم قليل الدهن", "100 g", 220, 27, 0, 12, "ground beef mince"),
  food("Beef steak, grilled", "ستيك لحم مشوي", "1 piece · 150 g", 375, 45, 0, 21, "steak beef"),
  food("Beef stew meat, cooked", "لحم بقري مطبوخ", "100 g", 250, 30, 0, 14, "lahma beef"),
  food("Lamb chops, grilled", "ريش ضاني مشوية", "2 pieces · 120 g", 350, 30, 0, 25, "lamb mutton dany"),
  food("Beef liver, cooked", "كبدة بقري", "100 g", 190, 29, 5, 5, "kebda liver"),
  food("Chicken liver, cooked", "كبدة فراخ", "100 g", 170, 24, 1, 7, "kebda liver"),
  food("Grilled tilapia", "بلطي مشوي", "1 fillet · 150 g", 195, 39, 0, 4, "bolti fish"),
  food("Fried tilapia", "بلطي مقلي", "1 fillet · 150 g", 300, 35, 8, 14, "bolti fish"),
  food("Grilled mullet", "بوري مشوي", "1 fillet · 150 g", 225, 37, 0, 8, "bouri fish"),
  food("Grilled mackerel", "ماكريل مشوي", "1 fillet · 150 g", 390, 36, 0, 27, "mackerel fish"),
  food("Canned sardines in oil", "سردين معلب", "1 can drained · 90 g", 190, 22, 0, 11, "sardine"),
  food("Grilled shrimp", "جمبري مشوي", "1 cup · 150 g", 150, 36, 0, 2, "gambari prawns"),
  food("Fried calamari", "كاليماري مقلي", "1 cup · 150 g", 260, 27, 12, 11, "squid sobeit"),
  food("Boiled egg", "بيضة مسلوقة", "1 egg · 50 g", 78, 6.3, 0.6, 5.3, "egg beid"),
  food("Egg whites", "بياض بيض", "3 eggs · 100 g", 52, 11, 0.7, 0.2, "egg white"),
  food("Fried egg", "بيضة مقلية", "1 egg · 46 g", 90, 6.3, 0.4, 7, "egg beid"),
  food("Omelette, 2 eggs", "أومليت بيضتين", "1 serving · 120 g", 190, 13, 1, 15, "omelet eggs"),
  food("Shakshuka", "شكشوكة", "1 plate · 250 g", 260, 14, 12, 17, "eggs tomato"),
  food("Eggs with pastirma", "بيض بالبسطرمة", "1 plate · 150 g", 330, 22, 2, 26, "basterma eggs"),
  food("Cottage cheese", "جبنة قريش", "½ cup · 110 g", 90, 12, 4, 2.5, "areesh gebna"),
  food("Mozzarella", "جبنة موتزاريلا", "1 slice · 30 g", 85, 6, 1, 6, "gebna cheese"),
  food("Cheddar cheese", "جبنة شيدر", "1 slice · 28 g", 113, 7, 0.4, 9, "gebna cheese"),
  food("Halloumi, grilled", "جبنة حلوم مشوية", "2 slices · 50 g", 160, 11, 1, 12.5, "halloumi gebna"),
  food("Processed cheese triangle", "جبنة مثلثات", "1 piece · 17 g", 45, 2, 1, 3.5, "cheese spread gebna"),
  food("Whey protein", "واي بروتين", "1 scoop · 30 g", 120, 24, 3, 1.5, "protein shake powder"),
  food("Casein protein", "بروتين كازين", "1 scoop · 33 g", 120, 24, 4, 1, "protein powder"),
  food("Tofu", "توفو", "½ cup · 125 g", 95, 10, 2, 6, "soy tofu"),
  food("Cooked lentils", "عدس مطبوخ", "1 cup · 200 g", 230, 18, 40, 0.8, "ads lentils"),
  food("Cooked chickpeas", "حمص مسلوق", "1 cup · 165 g", 270, 15, 45, 4, "homos chickpeas"),
  food("White beans, cooked", "فاصوليا بيضاء", "1 cup · 180 g", 250, 17, 45, 0.6, "fasolia beans"),
  food("Kidney beans, cooked", "فاصوليا حمراء", "1 cup · 175 g", 225, 15, 40, 0.9, "beans"),
  food("Cooked white rice", "رز أبيض مطبوخ", "1 cup · 160 g", 205, 4.3, 45, 0.4, "roz rice"),
  food("Cooked basmati rice", "رز بسمتي", "1 cup · 160 g", 210, 4.4, 46, 0.5, "roz rice"),
  food("Cooked pasta", "مكرونة مسلوقة", "1 cup · 140 g", 220, 8, 43, 1.3, "macarona spaghetti penne"),
  food("Whole-wheat pasta, cooked", "مكرونة قمح كامل", "1 cup · 140 g", 175, 7.5, 37, 0.8, "macarona pasta"),
  food("Pasta with red sauce", "مكرونة صلصة", "1 plate · 300 g", 390, 12, 68, 8, "macarona tomato sauce"),
  food("Cooked bulgur", "برغل مطبوخ", "1 cup · 180 g", 150, 5.6, 34, 0.4, "borghol"),
  food("Cooked freekeh", "فريك مطبوخ", "1 cup · 160 g", 200, 8, 38, 1.5, "freek"),
  food("Cooked couscous", "كسكسي مطبوخ", "1 cup · 157 g", 175, 6, 36, 0.3, "kuskusi couscous"),
  food("Cooked quinoa", "كينوا مطبوخة", "1 cup · 185 g", 220, 8, 39, 3.5, "quinoa"),
  food("Cornflakes", "كورن فليكس", "1 cup · 30 g", 110, 2, 25, 0.2, "cereal"),
  food("Granola", "جرانولا", "½ cup · 55 g", 250, 6, 33, 10, "cereal muesli"),
  food("Whole-wheat bread", "عيش توست أسمر", "1 slice · 32 g", 80, 4, 14, 1, "toast bread"),
  food("White toast bread", "عيش توست أبيض", "1 slice · 28 g", 75, 2.5, 14, 1, "toast bread"),
  food("Shami bread", "عيش شامي", "1 loaf · 90 g", 245, 8, 50, 1, "pita syrian bread"),
  food("Tortilla wrap", "تورتيلا", "1 piece · 60 g", 180, 5, 30, 4.5, "wrap"),
  food("Sweet potato, baked", "بطاطا مشوية", "1 piece · 150 g", 135, 3, 31, 0.2, "batata"),
  food("Mashed potatoes", "بطاطس بيوريه", "1 cup · 210 g", 235, 4, 35, 9, "potato puree"),
  food("French fries", "بطاطس محمرة", "1 serving · 115 g", 360, 4, 48, 17, "fries chips"),
  food("Oven-baked potato wedges", "بطاطس ودجز بالفرن", "1 serving · 150 g", 200, 3.5, 33, 6, "potato"),
  food("Sweetcorn", "ذرة", "½ cup · 80 g", 70, 2.5, 15, 1, "dorra corn"),
  food("Grilled corn on the cob", "كوز ذرة مشوي", "1 piece · 150 g", 140, 5, 30, 2, "dorra corn"),
  food("Rice cakes", "كيك أرز", "2 pieces · 18 g", 70, 1.5, 15, 0.5, "rice cake"),
  food("Crackers", "بسكويت مالح", "5 pieces · 25 g", 120, 2, 17, 5, "crackers"),
  food("Honey", "عسل نحل", "1 tbsp · 21 g", 64, 0, 17, 0, "asal"),
  food("Jam", "مربى", "1 tbsp · 20 g", 55, 0, 14, 0, "morabba"),
  food("Sugar", "سكر", "1 tsp · 4 g", 16, 0, 4, 0, "sokkar"),
  food("Molasses", "عسل أسود", "1 tbsp · 20 g", 58, 0, 15, 0, "asal eswed"),
  food("Apple", "تفاح", "1 piece · 180 g", 95, 0.5, 25, 0.3, "tofah"),
  food("Orange", "برتقال", "1 piece · 140 g", 65, 1.3, 16, 0.2, "borto2an"),
  food("Mandarin", "يوسفي", "1 piece · 90 g", 47, 0.7, 12, 0.3, "yosfy tangerine"),
  food("Grapes", "عنب", "1 cup · 150 g", 104, 1.1, 27, 0.2, "enab"),
  food("Watermelon", "بطيخ", "2 cups · 300 g", 90, 1.8, 23, 0.5, "batikh"),
  food("Cantaloupe", "كانتلوب", "1 cup · 160 g", 55, 1.3, 13, 0.3, "shammam melon"),
  food("Strawberries", "فراولة", "1 cup · 150 g", 48, 1, 11.5, 0.5, "farawla"),
  food("Pomegranate", "رمان", "½ cup · 87 g", 72, 1.5, 16, 1, "roman"),
  food("Fresh figs", "تين", "2 pieces · 100 g", 74, 0.8, 19, 0.3, "teen"),
  food("Peach", "خوخ", "1 piece · 150 g", 60, 1.4, 14, 0.4, "khokh"),
  food("Pear", "كمثرى", "1 piece · 180 g", 100, 0.6, 27, 0.2, "kommetra"),
  food("Kiwi", "كيوي", "1 piece · 75 g", 45, 0.8, 11, 0.4, "kiwi"),
  food("Pineapple", "أناناس", "1 cup · 165 g", 82, 0.9, 22, 0.2, "ananas"),
  food("Apricots", "مشمش", "3 pieces · 105 g", 50, 1.5, 12, 0.4, "meshmesh"),
  food("Blueberries", "توت أزرق", "1 cup · 150 g", 85, 1.1, 21, 0.5, "berries"),
  food("Raisins", "زبيب", "2 tbsp · 20 g", 60, 0.6, 16, 0.1, "zebib"),
  food("Dried apricots", "مشمش مجفف", "5 pieces · 35 g", 85, 1.2, 22, 0.2, "meshmesh"),
  food("Prickly pear", "تين شوكي", "2 pieces · 200 g", 80, 1.5, 19, 1, "teen shoky"),
  food("Tomato", "طماطم", "1 piece · 120 g", 22, 1, 4.7, 0.2, "tamatem"),
  food("Cucumber", "خيار", "1 piece · 200 g", 30, 1.3, 7, 0.2, "khiar"),
  food("Carrot", "جزر", "1 piece · 70 g", 29, 0.7, 7, 0.2, "gazar"),
  food("Lettuce", "خس", "2 cups · 70 g", 10, 0.9, 2, 0.1, "khass"),
  food("Spinach, cooked", "سبانخ مطبوخة", "1 cup · 180 g", 41, 5.3, 6.8, 0.5, "sabanekh"),
  food("Zucchini, cooked", "كوسة مطبوخة", "1 cup · 180 g", 30, 2.3, 5.5, 0.6, "kousa courgette"),
  food("Green beans, cooked", "فاصوليا خضراء", "1 cup · 125 g", 44, 2.4, 10, 0.4, "fasolia"),
  food("Peas, cooked", "بسلة", "1 cup · 160 g", 125, 8, 22, 0.6, "besella"),
  food("Bell pepper", "فلفل رومي", "1 piece · 120 g", 30, 1, 7, 0.3, "felfel pepper"),
  food("Onion", "بصل", "1 piece · 110 g", 44, 1.2, 10, 0.1, "basal"),
  food("Mushrooms, sautéed", "مشروم سوتيه", "1 cup · 150 g", 80, 4, 6, 5, "mushroom"),
  food("Cauliflower, cooked", "قرنبيط مطبوخ", "1 cup · 125 g", 29, 2.3, 5, 0.6, "arnabit"),
  food("Cabbage, raw", "كرنب", "1 cup · 90 g", 22, 1.2, 5, 0.1, "koronb"),
  food("Grilled eggplant", "باذنجان مشوي", "1 cup · 100 g", 35, 0.8, 8.7, 0.2, "betengan aubergine"),
  food("Beetroot, cooked", "بنجر مسلوق", "½ cup · 85 g", 37, 1.4, 8.5, 0.2, "bangar beets"),
  food("Egyptian salad", "سلطة بلدي", "1 bowl · 200 g", 70, 2, 9, 3.5, "salata baladi tomato cucumber"),
  food("Tahini salad", "سلطة طحينة", "2 tbsp · 40 g", 90, 2.5, 3, 8, "tahina salad"),
  food("Pickles", "طرشي", "½ cup · 75 g", 15, 0.4, 3, 0.2, "torshi"),
  food("Almonds", "لوز", "1 handful · 28 g", 165, 6, 6, 14, "loz nuts"),
  food("Walnuts", "عين جمل", "1 handful · 28 g", 185, 4.3, 3.9, 18.5, "ein gamal nuts"),
  food("Peanuts", "سوداني", "1 handful · 28 g", 160, 7, 4.6, 14, "soudany nuts"),
  food("Cashews", "كاجو", "1 handful · 28 g", 155, 5, 9, 12, "kaju nuts"),
  food("Pistachios", "فستق", "1 handful · 28 g", 160, 6, 8, 13, "fozdo2 nuts"),
  food("Mixed nuts", "مكسرات مشكلة", "1 handful · 28 g", 170, 5, 6, 15, "nuts mekassarat"),
  food("Sunflower seeds", "لب أبيض", "1 handful · 28 g", 165, 5.5, 6, 14, "lebb seeds"),
  food("Chia seeds", "بذور الشيا", "1 tbsp · 12 g", 58, 2, 5, 3.7, "chia"),
  food("Flaxseed, ground", "بذر كتان", "1 tbsp · 7 g", 37, 1.3, 2, 3, "linseed"),
  food("Peanut butter", "زبدة فول سوداني", "1 tbsp · 16 g", 95, 3.5, 3.5, 8, "peanut butter"),
  food("Butter", "زبدة", "1 tbsp · 14 g", 100, 0.1, 0, 11.5, "zebda"),
  food("Ghee", "سمن بلدي", "1 tbsp · 13 g", 115, 0, 0, 13, "samna"),
  food("Vegetable oil", "زيت نباتي", "1 tbsp · 14 g", 120, 0, 0, 14, "zeit oil"),
  food("Black olives", "زيتون أسود", "5 pieces · 20 g", 25, 0.2, 1.3, 2.2, "zeitoun"),
  food("Green olives", "زيتون أخضر", "5 pieces · 20 g", 30, 0.2, 0.8, 3, "zeitoun"),
  food("Low-fat yogurt", "زبادي قليل الدسم", "1 cup · 170 g", 105, 9, 12, 2.5, "zabadi"),
  food("High-protein yogurt", "زبادي عالي البروتين", "1 cup · 150 g", 95, 15, 7, 0.5, "zabadi protein"),
  food("Laban rayeb", "لبن رايب", "1 cup · 240 ml", 110, 8, 11, 4, "rayeb buttermilk"),
  food("Chocolate milk", "لبن بالشوكولاتة", "1 cup · 240 ml", 190, 8, 26, 5, "milk"),
  food("Orange juice, fresh", "عصير برتقال فريش", "1 glass · 250 ml", 110, 1.7, 26, 0.5, "aseer borto2an"),
  food("Mango juice", "عصير مانجو", "1 glass · 250 ml", 150, 0.5, 37, 0.3, "aseer manga"),
  food("Guava juice", "عصير جوافة", "1 glass · 250 ml", 140, 0.5, 35, 0.3, "aseer gawafa"),
  food("Lemon juice with sugar", "عصير ليمون", "1 glass · 250 ml", 100, 0.2, 26, 0, "lamoun lemonade"),
  food("Hibiscus drink", "كركديه", "1 glass · 250 ml", 90, 0, 23, 0, "karkade"),
  food("Tamarind drink", "تمر هندي", "1 glass · 250 ml", 120, 0.3, 30, 0, "tamr hendi"),
  food("Sobia", "سوبيا", "1 glass · 250 ml", 200, 3, 38, 4, "sobya"),
  food("Cola", "مشروب غازي كولا", "1 can · 330 ml", 140, 0, 35, 0, "soda pepsi coke"),
  food("Diet cola", "كولا دايت", "1 can · 330 ml", 1, 0, 0, 0, "soda zero"),
  food("Energy drink", "مشروب طاقة", "1 can · 250 ml", 115, 0, 28, 0, "red bull"),
  food("Black coffee", "قهوة سادة", "1 cup · 240 ml", 2, 0.3, 0, 0, "ahwa americano"),
  food("Turkish coffee, medium sugar", "قهوة تركي مظبوط", "1 cup · 60 ml", 20, 0, 5, 0, "ahwa"),
  food("Café latte", "لاتيه", "1 cup · 350 ml", 190, 10, 15, 7, "coffee latte"),
  food("Cappuccino", "كابتشينو", "1 cup · 250 ml", 120, 6, 10, 6, "coffee"),
  food("Hot chocolate", "هوت شوكليت", "1 cup · 250 ml", 230, 8, 30, 9, "cocoa"),
  food("Tea with milk", "شاي بلبن", "1 cup · 240 ml", 70, 2, 10, 2, "shai laban"),
  food("Green tea", "شاي أخضر", "1 cup · 240 ml", 2, 0, 0, 0, "tea"),
  food("Okra stew with meat", "بامية باللحمة", "1 bowl · 300 g", 330, 22, 18, 19, "bamya"),
  food("Green bean stew", "فاصوليا خضراء باللحمة", "1 bowl · 300 g", 290, 18, 20, 15, "fasolia stew"),
  food("Potato stew with meat", "بطاطس باللحمة", "1 bowl · 300 g", 360, 20, 30, 17, "batates"),
  food("Pea and carrot stew", "بسلة بالجزر", "1 bowl · 300 g", 280, 15, 32, 10, "besella"),
  food("Fattah with meat", "فتة باللحمة", "1 plate · 400 g", 780, 38, 80, 32, "fatta"),
  food("Roz meammar", "رز معمر", "1 plate · 250 g", 480, 12, 50, 26, "rice"),
  food("Stuffed pigeon", "حمام محشي", "1 piece · 300 g", 650, 40, 45, 34, "hamam mahshi"),
  food("Sayadeya fish and rice", "صيادية", "1 plate · 350 g", 520, 35, 60, 14, "fish rice"),
  food("Mesaqaa", "مسقعة", "1 plate · 250 g", 320, 9, 18, 24, "moussaka eggplant"),
  food("Ful sandwich", "ساندوتش فول", "1 sandwich · 150 g", 290, 12, 45, 7, "foul"),
  food("Ta’meya sandwich", "ساندوتش طعمية", "1 sandwich · 170 g", 380, 12, 48, 16, "falafel tameya"),
  food("Sogo’ sandwich", "ساندوتش سجق", "1 sandwich · 180 g", 480, 20, 42, 26, "sausage sogo2"),
  food("Grilled chicken, half", "نص فرخة مشوية", "1 piece · 450 g", 900, 95, 0, 57, "frakh mashwy"),
  food("Egyptian crepe with chicken", "كريب فراخ", "1 piece · 300 g", 620, 30, 60, 28, "crepe"),
  food("Lentils with rice (kushari-style)", "عدس بالرز", "1 plate · 300 g", 420, 16, 70, 8, "ads roz"),
  food("Rice pudding", "رز بلبن", "1 cup · 200 g", 260, 7, 45, 6, "roz bel laban"),
  food("Mehalabeya", "مهلبية", "1 cup · 200 g", 220, 6, 38, 5, "muhallabia"),
  food("Qatayef", "قطايف", "2 pieces · 120 g", 360, 6, 48, 16, "katayef"),
  food("Kahk", "كحك", "1 piece · 40 g", 190, 2.5, 22, 10, "kahk eid cookie"),
  food("Ghorayeba", "غريبة", "1 piece · 30 g", 150, 1.5, 17, 8.5, "ghraybeh cookie"),
  food("Zalabya", "زلابية", "5 pieces · 75 g", 270, 3, 40, 11, "lokma zalabia"),
  food("Feteer with honey", "فطير بالعسل", "1 slice · 120 g", 470, 7, 55, 25, "fetir"),
  food("Cheeseburger", "تشيز برجر", "1 sandwich · 200 g", 520, 28, 40, 27, "burger"),
  food("Beef burger, single", "برجر لحم", "1 sandwich · 180 g", 460, 25, 38, 23, "burger"),
  food("Fried chicken, breast piece", "فراخ مقلية صدر", "1 piece · 160 g", 400, 34, 14, 23, "broasted kfc"),
  food("Chicken nuggets", "ناجتس فراخ", "6 pieces · 100 g", 290, 15, 18, 17, "nuggets"),
  food("Margherita pizza", "بيتزا مارجريتا", "1 slice · 110 g", 280, 12, 33, 11, "pizza"),
  food("Pepperoni pizza", "بيتزا بيبروني", "1 slice · 110 g", 310, 13, 32, 14, "pizza"),
  food("Chicken wrap", "راب فراخ", "1 piece · 250 g", 480, 30, 45, 19, "wrap"),
  food("Shawarma plate, chicken", "طبق شاورما فراخ", "1 plate · 400 g", 750, 45, 55, 38, "shawerma"),
  food("Croissant", "كرواسون", "1 piece · 60 g", 240, 5, 26, 12, "croissant"),
  food("Chocolate croissant", "كرواسون شوكولاتة", "1 piece · 70 g", 300, 5, 32, 17, "croissant"),
  food("Chocolate cake", "كيك شوكولاتة", "1 slice · 95 g", 350, 5, 50, 15, "cake"),
  food("Plain sponge cake", "كيك سادة", "1 slice · 60 g", 190, 3.5, 30, 6, "cake"),
  food("Chocolate chip cookies", "كوكيز", "2 pieces · 30 g", 145, 1.6, 20, 7, "cookies"),
  food("Digestive biscuits", "بسكويت دايجستيف", "2 pieces · 30 g", 140, 2, 20, 6, "biscuit"),
  food("Milk chocolate", "شوكولاتة باللبن", "1 bar · 45 g", 240, 3.5, 26, 13.5, "chocolate"),
  food("Dark chocolate 70%", "شوكولاتة داكنة", "2 pieces · 20 g", 120, 1.6, 9, 8.5, "chocolate"),
  food("Protein bar", "بروتين بار", "1 bar · 60 g", 220, 20, 22, 7, "protein snack"),
  food("Popcorn, salted", "فشار", "3 cups · 24 g", 110, 3, 18, 3, "pop corn feshar"),
  food("Potato crisps", "شيبسي", "1 bag · 40 g", 215, 2.5, 21, 14, "chips chipsy"),
  food("Ice cream", "آيس كريم", "½ cup · 66 g", 140, 2.4, 16, 7, "ice cream"),
  food("Frozen yogurt", "فروزن زبادي", "½ cup · 90 g", 115, 3, 20, 3, "froyo"),
];

export const ALL_FOODS = [...FOODS.map(food => ({ ...food, source: 'Typical values' })), ...EGYPT_FOODS, ...EVERYDAY_FOODS];

const plain = text => String(text || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ’']/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه');

// Every word of the query must appear in the name, Arabic name or alternative spellings.
export function searchFoods(list, query) {
  const words = plain(query).split(/\s+/).filter(Boolean);
  if (!words.length) return list;
  return list.filter(food => {
    const text = plain(`${food.name} ${food.ar || translateExact(food.name) || ''} ${food.tags || ''}`);
    return words.every(word => text.includes(word));
  });
}

// Search results in a natural order: an exact name first, then names that start with the
// query, then names with a word that starts with it, then the rest. A coach's custom foods
// are ranked the same way as library foods. Ties keep the list order.
export function rankFoods(list, query) {
  const found = searchFoods(list, query), q = plain(query).trim();
  if (!q) return found;
  const score = (food) => {
    const names = [plain(food.name), plain(food.ar || translateExact(food.name) || '')];
    if (names.includes(q)) return 0;
    if (names.some((n) => n.startsWith(q))) return 1;
    if (names.some((n) => n.split(/[\s,()]+/).some((w) => w.startsWith(q)))) return 2;
    return 3;
  };
  return found.map((food, i) => [score(food), i, food]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).map((entry) => entry[2]);
}

// A coach's custom foods in the shape of library foods, marked so the app can label them.
export const customLibrary = (foods = []) => foods.map((food) => ({ ...food, custom: true }));

export const validBarcode = code => /^\d{8,14}$/.test(String(code || '').trim());

const num = value => (value != null && value !== '' && Number.isFinite(Number(value)) ? Math.round(Number(value) * 10) / 10 : null);

// Open Food Facts product → a food ready for review. Per serving when the label
// gives one, otherwise per 100 g / 100 ml. Missing values stay empty, never zero.
export function productToFood(json, code) {
  const product = json?.status === 1 || json?.product ? json.product : null;
  if (!product) return null;
  const n = product.nutriments || {};
  const servingKcal = n['energy-kcal_serving'] ?? (n.energy_serving ? n.energy_serving / 4.184 : undefined);
  const perServing = servingKcal != null && Boolean(product.serving_size);
  const pick = key => num(perServing ? n[`${key}_serving`] : n[`${key}_100g`]);
  const kcal = num(perServing ? servingKcal : n['energy-kcal_100g'] ?? (n.energy_100g ? n.energy_100g / 4.184 : undefined));
  const brand = product.brands?.split(',')[0]?.trim(), title = (product.product_name || product.generic_name || '').trim();
  const name = brand && title.toLowerCase().includes(brand.toLowerCase()) ? title : [brand, title].filter(Boolean).join(' · ');
  if (!name && kcal == null) return null;
  const unit = /\d\s*(ml|cl|l)\b/i.test(product.quantity || '') ? '100 ml' : '100 g';
  return {
    name: (name || `Product ${code}`).slice(0, 120),
    portion: perServing ? String(product.serving_size).slice(0, 60) : unit,
    kcal: kcal == null ? '' : Math.round(kcal),
    p: pick('proteins') ?? '',
    c: pick('carbohydrates') ?? '',
    f: pick('fat') ?? '',
    barcode: code,
    source: 'Open Food Facts',
  };
}

export async function lookupBarcode(code, { signal } = {}) {
  const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,generic_name,brands,quantity,serving_size,nutriments`, { signal, headers: { Accept: 'application/json' } }).catch(error => { if (error.name === 'AbortError') throw error; throw new Error('The food database couldn’t be reached. Check your connection and try again.'); });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('The food database didn’t respond. Check your connection and try again.');
  return productToFood(await response.json(), code);
}
