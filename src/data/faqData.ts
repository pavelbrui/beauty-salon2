/**
 * FAQ data for various services
 * Used by FAQSection component to display frequently asked questions
 */

export interface FAQItem {
  question: string;
  answer: string;
}

export const faqByCategory: Record<string, FAQItem[]> = {
  // Makijaż permanentny
  'makijaz-permanentny': [
    {
      question: 'Ile trwa zabieg makijażu permanentnego brwi?',
      answer:
        'Zabieg trwa zazwyczaj 2-3 godziny. Czas zależy od wybranej metody (microblading, powder brows, combo brows) i indywidualnych potrzeb klienta. Podczas wizyty przeprowadzam konsultację, przygotowanie skóry, nanoszenie pigmentu oraz instrukcje pielęgnacji.',
    },
    {
      question: 'Czy makijaż permanentny brwi boli?',
      answer:
        'Stosujemy profesjonalne znieczulenie topiczne, które znacznie zmniejsza dyskomfort. Większość klientów opisuje zabiegi jako niebolące lub mało bolesne. Czułość zależy od indywidualnego progu bólu każdej osoby.',
    },
    {
      question: 'Jak długo trwa efekt makijażu permanentnego?',
      answer:
        'Efekt makijażu permanentnego utrzymuje się zazwyczaj 18-24 miesiące. Czas zależy od typu skóry, ekspozycji na słońce i indywidualnej metaboliki. Zalecam odświeżenie co 12-18 miesięcy, aby utrzymać intensywność koloru i kształtu.',
    },
    {
      question: 'Jakie są przeciwwskazania do makijażu permanentnego?',
      answer:
        'Przeciwwskazania to: ciąża i karmienie piersią, aktywne infekcje skóry, alergia na pigmenty, niektóre leki immunosupresyjne, oraz zaburzenia krzepnięcia krwi. Zawsze przeprowadzam szczegółową konsultację przed zabiegiem.',
    },
    {
      question: 'Jaka jest cena makijażu permanentnego w Białymstoku?',
      answer:
        'Cena makijażu permanentnego brwi w naszym salonie wynosi 800-1200 PLN w zależności od wybranej metody i zakresu pracy. Makijaż permanentny ust kosztuje 900-1300 PLN. Oferujemy również pakiety promocyjne dla nowych klientów.',
    },
  ],

  // Stylizacja rzęs
  'stylizacja-rzes': [
    {
      question: 'Ile trwa przedłużanie rzęs?',
      answer:
        'Przedłużanie rzęs trwa 2-3 godziny w zależności od liczby rzęs i wybranej techniki. Pierwsze przedłużanie trwa dłużej ze względu na przygotowanie. Odświeżenia trwają 1-1,5 godziny.',
    },
    {
      question: 'Jak długo utrzymuje się przedłużanie rzęs?',
      answer:
        'Przedłużone rzęsy utrzymują się 4-6 tygodni. Naturalne rzęsy wypadają w naturalnym cyklu (każde 3-4 tygodnie), a przedłużenia wypadają razem z nimi. Zalecam odświeżenia co 3-4 tygodnie, aby utrzymać pełny efekt.',
    },
    {
      question: 'Czy przedłużanie rzęs niszczy naturalne rzęsy?',
      answer:
        'Profesjonalnie wykonane przedłużanie rzęs nie niszczy naturalnych rzęs. Używamy najwyższej jakości materiałów i technik. Ważna jest właściwa pielęgnacja i regularne odświeżenia. Po zdejmowaniu rzęs naturalne rzęsy regenerują się w 4-6 tygodni.',
    },
    {
      question: 'Jakie są rodzaje przedłużania rzęs?',
      answer:
        'Oferujemy przedłużanie 1:1 (jedna sztuczna rzęsa na jedną naturalną), rzęsy objętościowe 2D-5D (wiele cienkich rzęs na jedną naturalną) oraz laminację rzęs (zabiegi pielęgnacyjne bez przedłużania). Każda metoda daje inny efekt i ma inne zastosowanie.',
    },
  ],

  // Pielęgnacja brwi
  'pielegnacja-brwi': [
    {
      question: 'Co to jest laminacja brwi?',
      answer:
        'Laminacja brwi to zabieg pielęgnacyjny, który utrwala brwi w wybranym kierunku, nadając im gęsty i wypełniony wygląd. Efekt utrzymuje się 4-6 tygodni. Idealny dla osób z gęstymi brwiami lub chcących poprawić ich kształt.',
    },
    {
      question: 'Jakie są rodzaje zabiegu brwi?',
      answer:
        'Oferujemy laminację brwi, henna pudrową, regulację brwi, botox brwi, lifting brwi oraz styling brwi. Każdy zabieg ma inne zastosowanie i efekt. Podczas konsultacji pomogę wybrać najlepszą opcję dla Twoich brwi.',
    },
    {
      question: 'Jak długo trwa efekt henny pudrowej?',
      answer:
        'Henna pudrowa utrzymuje się 3-4 tygodnie. Pigment stopniowo zanika, a brwi wracają do naturalnego koloru. Efekt zależy od typu skóry i ekspozycji na słońce. Zalecam odświeżenia co 3-4 tygodnie.',
    },
  ],

  // Peeling węglowy
  'peeling-weglowy': [
    {
      question: 'Ile trwa zabieg peelingiem węglowym?',
      answer:
        'Zabieg peelingiem węglowym trwa 30-45 minut. Czas zależy od stanu skóry i zakresu pracy. Zabieg jest bezbolesny i nie wymaga czasu rekonwalescencji.',
    },
    {
      question: 'Ile zabiegów peelingiem węglowym potrzeba?',
      answer:
        'Zalecam serię 4-6 zabiegów wykonywanych co 2-3 tygodnie dla uzyskania optymalnych rezultatów. Efekty są widoczne już po pierwszym zabiegu, ale seria daje najlepsze i najtrwalsze rezultaty.',
    },
    {
      question: 'Jakie są efekty peelingiem węglowym?',
      answer:
        'Peeling węglowy zmniejsza pory, oczyszcza skórę, zmniejsza trądzik, wyrównuje koloryt skóry, zmniejsza blizny i poprawia teksturę skóry. Efekty są natychmiast widoczne, a skóra jest gładka i promienista.',
    },
  ],

  // Laserowe usuwanie tatuażu
  'laserowe-usuwanie': [
    {
      question: 'Ile sesji potrzeba do usunięcia tatuażu?',
      answer:
        'Liczba sesji zależy od wielkości, koloru i wieku tatuażu. Zazwyczaj potrzeba 5-15 sesji wykonywanych co 6-8 tygodni. Starsze tatuaże wymagają mniej sesji, a kolorowe mogą wymagać więcej.',
    },
    {
      question: 'Czy laserowe usuwanie tatuażu boli?',
      answer:
        'Zabieg jest bolesny, ale znośny. Porównywany do uczucia gumki strzelającej w skórę. Stosujemy znieczulenie topiczne, aby zmniejszyć dyskomfort. Po zabiegu skóra może być zaczerwieniona i opuchnięta przez kilka dni.',
    },
    {
      question: 'Czy laserowe usuwanie tatuażu zostawia blizny?',
      answer:
        'Profesjonalnie wykonane laserowe usuwanie tatuażu zwykle nie zostawia blizn. Jednak u osób ze skłonnością do tworzenia blizn hipertroficznych może dojść do zmiany tekstury skóry. Ważna jest właściwa pielęgnacja po zabiegu.',
    },
  ],

  // Manicure
  'manicure': [
    {
      question: 'Ile trwa manicure hybrydowy?',
      answer:
        'Manicure hybrydowy trwa 45-60 minut. Czas zależy od stanu paznokci i wybranego wzoru. Pierwsze manicure może trwać dłużej ze względu na przygotowanie paznokci.',
    },
    {
      question: 'Jak długo trwa manicure hybrydowy?',
      answer:
        'Manicure hybrydowy utrzymuje się 3-4 tygodnie. Lakier nie pęka ani się nie łuszczy. Efekt zależy od szybkości wzrostu paznokci i pielęgnacji.',
    },
    {
      question: 'Jakie są rodzaje manicure?',
      answer:
        'Oferujemy manicure hybrydowy, żelowy, klasyczny, japoński oraz pedicure. Każdy rodzaj ma inne właściwości i czas utrzymania. Podczas konsultacji pomogę wybrać najlepszą opcję dla Twoich paznokci.',
    },
  ],
};

/**
 * Get FAQ items for a specific category
 * @param categorySlug - URL-friendly category slug
 * @returns Array of FAQ items or empty array if category not found
 */
export const getFAQByCategory = (categorySlug: string): FAQItem[] => {
  return faqByCategory[categorySlug] || [];
};

/**
 * Get all FAQ categories
 * @returns Array of category slugs
 */
export const getFAQCategories = (): string[] => {
  return Object.keys(faqByCategory);
};
