/**
 * FAQ data for various services
 * Used by FAQSection component to display frequently asked questions
 */

export interface FAQItem {
  question: string;
  question_en?: string;
  question_ru?: string;
  answer: string;
  answer_en?: string;
  answer_ru?: string;
}

export const faqByCategory: Record<string, FAQItem[]> = {
  // Makijaż permanentny
  'makijaz-permanentny': [
    {
      question: 'Ile trwa zabieg makijażu permanentnego brwi?',
      question_en: 'How long does permanent brow makeup take?',
      question_ru: 'Сколько длится процедура перманентного макияжа бровей?',
      answer: 'Zabieg trwa zazwyczaj 2-3 godziny. Czas zależy od wybranej metody (powder brows, combo brows) i indywidualnych potrzeb klienta. Podczas wizyty przeprowadzam konsultację, przygotowanie skóry, nanoszenie pigmentu oraz instrukcje pielęgnacji.',
      answer_en: 'The procedure usually takes 2-3 hours. Duration depends on the chosen method (powder brows, combo brows) and individual client needs. The visit includes consultation, skin preparation, pigment application, and aftercare instructions.',
      answer_ru: 'Процедура обычно занимает 2-3 часа. Время зависит от выбранного метода (пудровые брови, комбо) и индивидуальных потребностей клиента. Визит включает консультацию, подготовку кожи, нанесение пигмента и инструкции по уходу.',
    },
    {
      question: 'Czy makijaż permanentny brwi boli?',
      question_en: 'Is permanent brow makeup painful?',
      question_ru: 'Больно ли делать перманентный макияж бровей?',
      answer: 'Stosujemy profesjonalne znieczulenie topiczne, które znacznie zmniejsza dyskomfort. Większość klientów opisuje zabiegi jako niebolące lub mało bolesne. Czułość zależy od indywidualnego progu bólu każdej osoby.',
      answer_en: 'We use professional topical anesthesia that significantly reduces discomfort. Most clients describe the procedure as painless or minimally uncomfortable. Sensitivity depends on each person\'s individual pain threshold.',
      answer_ru: 'Мы используем профессиональную местную анестезию, которая значительно снижает дискомфорт. Большинство клиентов описывают процедуру как безболезненную или минимально дискомфортную. Чувствительность зависит от индивидуального болевого порога.',
    },
    {
      question: 'Jak długo trwa efekt makijażu permanentnego?',
      question_en: 'How long does permanent makeup last?',
      question_ru: 'Как долго держится перманентный макияж?',
      answer: 'Efekt makijażu permanentnego utrzymuje się zazwyczaj 18-24 miesiące. Czas zależy od typu skóry, ekspozycji na słońce i indywidualnej metaboliki. Zalecam odświeżenie co 12-18 miesięcy, aby utrzymać intensywność koloru i kształtu.',
      answer_en: 'Permanent makeup typically lasts 18-24 months. Duration depends on skin type, sun exposure, and individual metabolism. We recommend refreshing every 12-18 months to maintain color intensity and shape.',
      answer_ru: 'Перманентный макияж обычно держится 18-24 месяца. Продолжительность зависит от типа кожи, воздействия солнца и индивидуального метаболизма. Рекомендуем обновление каждые 12-18 месяцев для поддержания интенсивности цвета и формы.',
    },
    {
      question: 'Jakie są przeciwwskazania do makijażu permanentnego?',
      question_en: 'What are the contraindications for permanent makeup?',
      question_ru: 'Какие противопоказания к перманентному макияжу?',
      answer: 'Przeciwwskazania to: ciąża i karmienie piersią, aktywne infekcje skóry, alergia na pigmenty, niektóre leki immunosupresyjne, oraz zaburzenia krzepnięcia krwi. Zawsze przeprowadzam szczegółową konsultację przed zabiegiem.',
      answer_en: 'Contraindications include: pregnancy and breastfeeding, active skin infections, pigment allergy, certain immunosuppressive medications, and blood clotting disorders. We always conduct a detailed consultation before the procedure.',
      answer_ru: 'Противопоказания: беременность и кормление грудью, активные инфекции кожи, аллергия на пигменты, некоторые иммуносупрессивные препараты и нарушения свёртываемости крови. Мы всегда проводим подробную консультацию перед процедурой.',
    },
    {
      question: 'Jaka jest cena makijażu permanentnego w Białymstoku?',
      question_en: 'What is the price of permanent makeup in Białystok?',
      question_ru: 'Какова цена перманентного макияжа в Белостоке?',
      answer: 'Cena makijażu permanentnego brwi w naszym salonie wynosi 800-1200 PLN w zależności od wybranej metody i zakresu pracy. Makijaż permanentny ust kosztuje 900-1300 PLN. Oferujemy również pakiety promocyjne dla nowych klientów.',
      answer_en: 'Permanent brow makeup at our salon costs 800-1200 PLN depending on the chosen method and scope of work. Permanent lip makeup costs 900-1300 PLN. We also offer promotional packages for new clients.',
      answer_ru: 'Перманентный макияж бровей в нашем салоне стоит 800-1200 PLN в зависимости от выбранного метода и объёма работы. Перманентный макияж губ стоит 900-1300 PLN. Мы также предлагаем акционные пакеты для новых клиентов.',
    },
  ],

  // Stylizacja rzęs
  'stylizacja-rzes': [
    {
      question: 'Ile trwa przedłużanie rzęs?',
      question_en: 'How long does lash extension take?',
      question_ru: 'Сколько длится наращивание ресниц?',
      answer: 'Przedłużanie rzęs trwa 2-3 godziny w zależności od liczby rzęs i wybranej techniki. Pierwsze przedłużanie trwa dłużej ze względu na przygotowanie. Odświeżenia trwają 1-1,5 godziny.',
      answer_en: 'Lash extensions take 2-3 hours depending on the number of lashes and chosen technique. The first extension takes longer due to preparation. Refills take 1-1.5 hours.',
      answer_ru: 'Наращивание ресниц занимает 2-3 часа в зависимости от количества ресниц и выбранной техники. Первое наращивание длится дольше из-за подготовки. Коррекция занимает 1-1,5 часа.',
    },
    {
      question: 'Jak długo utrzymuje się przedłużanie rzęs?',
      question_en: 'How long do lash extensions last?',
      question_ru: 'Как долго держатся наращённые ресницы?',
      answer: 'Przedłużone rzęsy utrzymują się 4-6 tygodni. Naturalne rzęsy wypadają w naturalnym cyklu (każde 3-4 tygodnie), a przedłużenia wypadają razem z nimi. Zalecam odświeżenia co 3-4 tygodnie, aby utrzymać pełny efekt.',
      answer_en: 'Lash extensions last 4-6 weeks. Natural lashes fall out in their natural cycle (every 3-4 weeks), and extensions fall with them. We recommend refills every 3-4 weeks to maintain the full effect.',
      answer_ru: 'Наращённые ресницы держатся 4-6 недель. Натуральные ресницы выпадают в естественном цикле (каждые 3-4 недели), и наращённые выпадают вместе с ними. Рекомендуем коррекцию каждые 3-4 недели для поддержания полного эффекта.',
    },
    {
      question: 'Czy przedłużanie rzęs niszczy naturalne rzęsy?',
      question_en: 'Do lash extensions damage natural lashes?',
      question_ru: 'Повреждает ли наращивание натуральные ресницы?',
      answer: 'Profesjonalnie wykonane przedłużanie rzęs nie niszczy naturalnych rzęs. Używamy najwyższej jakości materiałów i technik. Ważna jest właściwa pielęgnacja i regularne odświeżenia. Po zdejmowaniu rzęs naturalne rzęsy regenerują się w 4-6 tygodni.',
      answer_en: 'Professionally done lash extensions do not damage natural lashes. We use the highest quality materials and techniques. Proper care and regular refills are important. After removal, natural lashes regenerate in 4-6 weeks.',
      answer_ru: 'Профессионально выполненное наращивание не повреждает натуральные ресницы. Мы используем материалы и техники высочайшего качества. Важен правильный уход и регулярные коррекции. После снятия натуральные ресницы восстанавливаются за 4-6 недель.',
    },
    {
      question: 'Jakie są rodzaje przedłużania rzęs?',
      question_en: 'What types of lash extensions are available?',
      question_ru: 'Какие виды наращивания ресниц доступны?',
      answer: 'Oferujemy przedłużanie 1:1 (jedna sztuczna rzęsa na jedną naturalną), rzęsy objętościowe 2D-5D (wiele cienkich rzęs na jedną naturalną) oraz laminację rzęs (zabiegi pielęgnacyjne bez przedłużania). Każda metoda daje inny efekt i ma inne zastosowanie.',
      answer_en: 'We offer classic 1:1 extensions (one synthetic lash per natural), volume 2D-5D lashes (multiple thin lashes per natural), and lash lamination (care treatment without extensions). Each method produces a different effect for different needs.',
      answer_ru: 'Мы предлагаем классическое наращивание 1:1 (одна искусственная ресница на одну натуральную), объёмные ресницы 2D-5D (несколько тонких ресниц на одну натуральную) и ламинирование ресниц (уход без наращивания). Каждый метод даёт разный эффект для разных потребностей.',
    },
  ],

  // Pielęgnacja brwi
  'pielegnacja-brwi': [
    {
      question: 'Co to jest laminacja brwi?',
      question_en: 'What is brow lamination?',
      question_ru: 'Что такое ламинирование бровей?',
      answer: 'Laminacja brwi to zabieg pielęgnacyjny, który utrwala brwi w wybranym kierunku, nadając im gęsty i wypełniony wygląd. Efekt utrzymuje się 4-6 tygodni. Idealny dla osób z gęstymi brwiami lub chcących poprawić ich kształt.',
      answer_en: 'Brow lamination is a care treatment that sets brows in a chosen direction, giving them a thick, filled-in look. The effect lasts 4-6 weeks. Ideal for those with thick brows or wanting to improve their shape.',
      answer_ru: 'Ламинирование бровей — это ухаживающая процедура, которая фиксирует брови в выбранном направлении, придавая им густой, заполненный вид. Эффект сохраняется 4-6 недель. Идеально для обладательниц густых бровей или желающих улучшить их форму.',
    },
    {
      question: 'Jakie są rodzaje zabiegu brwi?',
      question_en: 'What types of brow treatments are available?',
      question_ru: 'Какие виды процедур для бровей доступны?',
      answer: 'Oferujemy laminację brwi, henna pudrową, regulację brwi, botox brwi, lifting brwi oraz styling brwi. Każdy zabieg ma inne zastosowanie i efekt. Podczas konsultacji pomogę wybrać najlepszą opcję dla Twoich brwi.',
      answer_en: 'We offer brow lamination, powder henna, brow shaping, brow botox, brow lifting, and brow styling. Each treatment has different applications and results. During consultation, we help choose the best option for your brows.',
      answer_ru: 'Мы предлагаем ламинирование бровей, пудровую хну, коррекцию бровей, ботокс бровей, лифтинг бровей и стайлинг бровей. Каждая процедура имеет разное назначение и эффект. На консультации мы поможем выбрать лучший вариант для ваших бровей.',
    },
    {
      question: 'Jak długo trwa efekt henny pudrowej?',
      question_en: 'How long does powder henna last?',
      question_ru: 'Как долго держится эффект пудровой хны?',
      answer: 'Henna pudrowa utrzymuje się 3-4 tygodnie. Pigment stopniowo zanika, a brwi wracają do naturalnego koloru. Efekt zależy od typu skóry i ekspozycji na słońce. Zalecam odświeżenia co 3-4 tygodnie.',
      answer_en: 'Powder henna lasts 3-4 weeks. The pigment gradually fades and brows return to their natural color. The effect depends on skin type and sun exposure. We recommend refreshing every 3-4 weeks.',
      answer_ru: 'Пудровая хна держится 3-4 недели. Пигмент постепенно исчезает, и брови возвращаются к натуральному цвету. Эффект зависит от типа кожи и воздействия солнца. Рекомендуем обновление каждые 3-4 недели.',
    },
  ],

  // Peeling węglowy
  'peeling-weglowy': [
    {
      question: 'Ile trwa zabieg peelingiem węglowym?',
      question_en: 'How long does a carbon peeling session take?',
      question_ru: 'Сколько длится процедура карбонового пилинга?',
      answer: 'Zabieg peelingiem węglowym trwa 30-45 minut. Czas zależy od stanu skóry i zakresu pracy. Zabieg jest bezbolesny i nie wymaga czasu rekonwalescencji.',
      answer_en: 'A carbon peeling session takes 30-45 minutes. Duration depends on skin condition and scope of work. The procedure is painless and requires no downtime.',
      answer_ru: 'Процедура карбонового пилинга длится 30-45 минут. Время зависит от состояния кожи и объёма работы. Процедура безболезненна и не требует периода восстановления.',
    },
    {
      question: 'Ile zabiegów peelingiem węglowym potrzeba?',
      question_en: 'How many carbon peeling sessions are needed?',
      question_ru: 'Сколько процедур карбонового пилинга нужно?',
      answer: 'Zalecam serię 4-6 zabiegów wykonywanych co 2-3 tygodnie dla uzyskania optymalnych rezultatów. Efekty są widoczne już po pierwszym zabiegu, ale seria daje najlepsze i najtrwalsze rezultaty.',
      answer_en: 'We recommend a series of 4-6 sessions every 2-3 weeks for optimal results. Effects are visible after the first session, but a series provides the best and most lasting results.',
      answer_ru: 'Рекомендуем серию из 4-6 процедур каждые 2-3 недели для достижения оптимальных результатов. Эффект заметен уже после первой процедуры, но серия даёт лучшие и наиболее стойкие результаты.',
    },
    {
      question: 'Jakie są efekty peelingiem węglowym?',
      question_en: 'What are the effects of carbon peeling?',
      question_ru: 'Каковы результаты карбонового пилинга?',
      answer: 'Peeling węglowy zmniejsza pory, oczyszcza skórę, zmniejsza trądzik, wyrównuje koloryt skóry, zmniejsza blizny i poprawia teksturę skóry. Efekty są natychmiast widoczne, a skóra jest gładka i promienista.',
      answer_en: 'Carbon peeling reduces pores, cleanses skin, reduces acne, evens skin tone, diminishes scars, and improves skin texture. Results are immediately visible — skin is smooth and radiant.',
      answer_ru: 'Карбоновый пилинг сужает поры, очищает кожу, уменьшает акне, выравнивает тон кожи, уменьшает рубцы и улучшает текстуру кожи. Результаты видны сразу — кожа гладкая и сияющая.',
    },
  ],

  // Laserowe usuwanie tatuażu
  'laserowe-usuwanie': [
    {
      question: 'Ile sesji potrzeba do usunięcia tatuażu?',
      question_en: 'How many sessions are needed to remove a tattoo?',
      question_ru: 'Сколько сеансов нужно для удаления тату?',
      answer: 'Liczba sesji zależy od wielkości, koloru i wieku tatuażu. Zazwyczaj potrzeba 5-15 sesji wykonywanych co 6-8 tygodni. Starsze tatuaże wymagają mniej sesji, a kolorowe mogą wymagać więcej.',
      answer_en: 'The number of sessions depends on the size, color, and age of the tattoo. Usually 5-15 sessions are needed every 6-8 weeks. Older tattoos require fewer sessions, while colored ones may need more.',
      answer_ru: 'Количество сеансов зависит от размера, цвета и возраста татуировки. Обычно требуется 5-15 сеансов каждые 6-8 недель. Старые татуировки требуют меньше сеансов, а цветные могут потребовать больше.',
    },
    {
      question: 'Czy laserowe usuwanie tatuażu boli?',
      question_en: 'Is laser tattoo removal painful?',
      question_ru: 'Болезненно ли лазерное удаление тату?',
      answer: 'Zabieg jest bolesny, ale znośny. Porównywany do uczucia gumki strzelającej w skórę. Stosujemy znieczulenie topiczne, aby zmniejszyć dyskomfort. Po zabiegu skóra może być zaczerwieniona i opuchnięta przez kilka dni.',
      answer_en: 'The procedure is uncomfortable but bearable. It is compared to the feeling of a rubber band snapping against the skin. We apply topical anesthesia to reduce discomfort. After the procedure, the skin may be red and swollen for a few days.',
      answer_ru: 'Процедура болезненна, но терпима. Её сравнивают с ощущением щелчка резинки по коже. Мы наносим местную анестезию для уменьшения дискомфорта. После процедуры кожа может быть покрасневшей и припухшей в течение нескольких дней.',
    },
    {
      question: 'Czy laserowe usuwanie tatuażu zostawia blizny?',
      question_en: 'Does laser tattoo removal leave scars?',
      question_ru: 'Оставляет ли лазерное удаление тату шрамы?',
      answer: 'Profesjonalnie wykonane laserowe usuwanie tatuażu zwykle nie zostawia blizn. Jednak u osób ze skłonnością do tworzenia blizn hipertroficznych może dojść do zmiany tekstury skóry. Ważna jest właściwa pielęgnacja po zabiegu.',
      answer_en: 'Professionally performed laser tattoo removal usually does not leave scars. However, people prone to hypertrophic scarring may experience skin texture changes. Proper aftercare is important.',
      answer_ru: 'Профессионально выполненное лазерное удаление тату обычно не оставляет шрамов. Однако у людей, склонных к гипертрофическим рубцам, возможны изменения текстуры кожи. Важен правильный уход после процедуры.',
    },
  ],

  // Manicure
  'manicure': [
    {
      question: 'Ile trwa manicure hybrydowy?',
      question_en: 'How long does hybrid manicure take?',
      question_ru: 'Сколько длится гибридный маникюр?',
      answer: 'Manicure hybrydowy trwa 45-60 minut. Czas zależy od stanu paznokci i wybranego wzoru. Pierwsze manicure może trwać dłużej ze względu na przygotowanie paznokci.',
      answer_en: 'Hybrid manicure takes 45-60 minutes. Duration depends on nail condition and chosen design. The first manicure may take longer due to nail preparation.',
      answer_ru: 'Гибридный маникюр занимает 45-60 минут. Время зависит от состояния ногтей и выбранного дизайна. Первый маникюр может длиться дольше из-за подготовки ногтей.',
    },
    {
      question: 'Jak długo trwa manicure hybrydowy?',
      question_en: 'How long does hybrid manicure last?',
      question_ru: 'Как долго держится гибридный маникюр?',
      answer: 'Manicure hybrydowy utrzymuje się 3-4 tygodnie. Lakier nie pęka ani się nie łuszczy. Efekt zależy od szybkości wzrostu paznokci i pielęgnacji.',
      answer_en: 'Hybrid manicure lasts 3-4 weeks. The polish does not chip or peel. The effect depends on nail growth speed and care.',
      answer_ru: 'Гибридный маникюр держится 3-4 недели. Лак не трескается и не шелушится. Эффект зависит от скорости роста ногтей и ухода.',
    },
    {
      question: 'Jakie są rodzaje manicure?',
      question_en: 'What types of manicure are available?',
      question_ru: 'Какие виды маникюра доступны?',
      answer: 'Oferujemy manicure hybrydowy, żelowy, klasyczny, japoński oraz pedicure. Każdy rodzaj ma inne właściwości i czas utrzymania. Podczas konsultacji pomogę wybrać najlepszą opcję dla Twoich paznokci.',
      answer_en: 'We offer hybrid, gel, classic, Japanese manicure, and pedicure. Each type has different properties and lasting time. During consultation, we help choose the best option for your nails.',
      answer_ru: 'Мы предлагаем гибридный, гелевый, классический, японский маникюр и педикюр. Каждый вид имеет разные свойства и время носки. На консультации мы поможем выбрать лучший вариант для ваших ногтей.',
    },
  ],
};

/**
 * Get FAQ items for a specific category, optionally localized
 * @param categorySlug - URL-friendly category slug
 * @param language - Language code (pl, en, ru). Defaults to 'pl'.
 * @returns Array of FAQ items with question/answer in the requested language
 */
export const getFAQByCategory = (categorySlug: string, language?: string): { question: string; answer: string }[] => {
  const items = faqByCategory[categorySlug];
  if (!items) return [];

  if (!language || language === 'pl') {
    return items.map(item => ({ question: item.question, answer: item.answer }));
  }

  return items.map(item => ({
    question: (language === 'en' ? item.question_en : item.question_ru) || item.question,
    answer: (language === 'en' ? item.answer_en : item.answer_ru) || item.answer,
  }));
};

/**
 * Get all FAQ categories
 * @returns Array of category slugs
 */
export const getFAQCategories = (): string[] => {
  return Object.keys(faqByCategory);
};
