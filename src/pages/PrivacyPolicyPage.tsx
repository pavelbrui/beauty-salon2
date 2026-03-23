import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { SEO } from '../components/SEO';
import { LocalizedLink } from '../components/LocalizedLink';
import { prerenderReady } from '../utils/prerenderReady';

const content = {
  pl: {
    title: 'Polityka Prywatności',
    seoDescription: 'Polityka prywatności salonu kosmetycznego Katarzyna Brui w Białymstoku. Informacje o przetwarzaniu danych osobowych zgodnie z RODO.',
    lastUpdated: 'Ostatnia aktualizacja: 20 marca 2026 r.',
    sections: [
      {
        heading: '1. Administrator danych osobowych',
        content: `Administratorem Twoich danych osobowych jest Katarzyna Brui, prowadząca działalność gospodarczą pod nazwą Salon Kosmetyczny Katarzyna Brui, ul. Młynowa 46, lok. U11, 15-404 Białystok, NIP: [NIP do uzupełnienia].

Kontakt z administratorem:
• E-mail: info@katarzynabrui.pl
• Telefon: +48 880 435 102
• Adres: ul. Młynowa 46, lok. U11, 15-404 Białystok`,
      },
      {
        heading: '2. Podstawy prawne przetwarzania danych',
        content: `Przetwarzamy Twoje dane osobowe na następujących podstawach prawnych (zgodnie z art. 6 ust. 1 RODO):

a) Zgoda (art. 6 ust. 1 lit. a RODO) — w przypadku zapisu na newsletter, wyrażenia zgody na komunikację marketingową lub korzystania z plików cookies analitycznych.

b) Wykonanie umowy (art. 6 ust. 1 lit. b RODO) — w przypadku rezerwacji wizyt, realizacji usług kosmetycznych, obsługi konta użytkownika.

c) Obowiązek prawny (art. 6 ust. 1 lit. c RODO) — w celu wypełnienia obowiązków podatkowych i rachunkowych wynikających z przepisów prawa.

d) Prawnie uzasadniony interes administratora (art. 6 ust. 1 lit. f RODO) — w celu dochodzenia roszczeń, prowadzenia statystyk i analiz, zapewnienia bezpieczeństwa usług.`,
      },
      {
        heading: '3. Cele przetwarzania danych',
        content: `Twoje dane osobowe przetwarzamy w następujących celach:

• Rezerwacja i realizacja wizyt — imię, nazwisko, e-mail, numer telefonu, uwagi do wizyty
• Prowadzenie konta użytkownika — adres e-mail, hasło (zaszyfrowane)
• Komunikacja — odpowiadanie na zapytania, wysyłanie potwierdzeń rezerwacji
• Marketing (za Twoją zgodą) — informowanie o promocjach, nowych usługach
• Analityka i poprawa jakości usług — anonimowe dane o korzystaniu ze strony (Google Analytics, wyłącznie po wyrażeniu zgody na cookies)
• Realizacja obowiązków prawnych — wystawianie faktur, prowadzenie ksiąg rachunkowych`,
      },
      {
        heading: '4. Odbiorcy danych',
        content: `Twoje dane mogą być przekazywane następującym kategoriom odbiorców:

• Supabase Inc. (USA) — dostawca usług bazodanowych i autoryzacji. Transfer danych do USA odbywa się na podstawie standardowych klauzul umownych (SCC) zatwierdzonych przez Komisję Europejską.
• Google LLC (USA) — usługi Google Analytics (wyłącznie po wyrażeniu zgody na cookies) oraz Google OAuth (logowanie przez Google). Transfer na podstawie EU-US Data Privacy Framework.
• Netlify Inc. (USA) — hosting strony internetowej. Transfer na podstawie standardowych klauzul umownych.
• Booksy International sp. z o.o. — system rezerwacji online (synchronizacja wizyt)
• Organy państwowe — w przypadkach przewidzianych prawem (np. urząd skarbowy)

Nie sprzedajemy Twoich danych osobowych podmiotom trzecim.`,
      },
      {
        heading: '5. Okres przechowywania danych',
        content: `Przechowujemy Twoje dane przez okres:

• Dane rezerwacyjne — przez okres realizacji usługi oraz 3 lata po ostatniej wizycie (okres przedawnienia roszczeń z tytułu umowy o świadczenie usług)
• Dane konta użytkownika — do czasu usunięcia konta przez użytkownika
• Dane podatkowe i rachunkowe — 5 lat od końca roku podatkowego, w którym powstał obowiązek podatkowy (zgodnie z Ordynacją podatkową)
• Dane marketingowe — do czasu wycofania zgody
• Dane analityczne (cookies) — maksymalnie 26 miesięcy (Google Analytics)`,
      },
      {
        heading: '6. Twoje prawa',
        content: `Na podstawie RODO przysługują Ci następujące prawa:

• Prawo dostępu do danych (art. 15 RODO) — możesz uzyskać informację o przetwarzanych danych
• Prawo do sprostowania (art. 16 RODO) — możesz poprawić nieprawidłowe dane
• Prawo do usunięcia danych (art. 17 RODO) — tzw. „prawo do bycia zapomnianym"
• Prawo do ograniczenia przetwarzania (art. 18 RODO)
• Prawo do przenoszenia danych (art. 20 RODO) — w formacie nadającym się do odczytu maszynowego
• Prawo do sprzeciwu (art. 21 RODO) — wobec przetwarzania opartego na prawnie uzasadnionym interesie
• Prawo do wycofania zgody — w dowolnym momencie, bez wpływu na zgodność z prawem przetwarzania dokonanego przed wycofaniem

Aby skorzystać ze swoich praw, skontaktuj się z nami: info@katarzynabrui.pl

Masz również prawo złożyć skargę do Prezesa Urzędu Ochrony Danych Osobowych (PUODO):
Urząd Ochrony Danych Osobowych, ul. Stawki 2, 00-193 Warszawa
www.uodo.gov.pl`,
      },
      {
        heading: '7. Pliki cookies',
        content: `Nasza strona wykorzystuje pliki cookies:

a) Niezbędne cookies — wymagane do prawidłowego działania strony (sesja użytkownika, preferencja językowa). Podstawa: prawnie uzasadniony interes (art. 6 ust. 1 lit. f RODO).

b) Analityczne cookies (Google Analytics) — zbierają anonimowe dane o sposobie korzystania ze strony. Są uruchamiane wyłącznie po wyrażeniu zgody za pomocą baneru cookie.

Możesz zarządzać ustawieniami cookies w swojej przeglądarce. Wycofanie zgody na cookies analityczne nie wpływa na działanie strony.

Używamy Google Analytics z anonimizacją adresów IP (parametr send_page_view: false do momentu wyrażenia zgody). Identyfikator śledzenia: G-BP257P61XY.`,
      },
      {
        heading: '8. Bezpieczeństwo danych',
        content: `Stosujemy odpowiednie środki techniczne i organizacyjne w celu ochrony Twoich danych osobowych, w tym:

• Szyfrowanie połączeń (SSL/TLS)
• Zabezpieczenia na poziomie bazy danych (Row Level Security w Supabase)
• Hashowanie haseł
• Regularne aktualizacje oprogramowania
• Nagłówki bezpieczeństwa HTTP (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)`,
      },
      {
        heading: '9. Logowanie przez Google',
        content: `Oferujemy możliwość logowania za pomocą konta Google (Google OAuth). W tym przypadku otrzymujemy z Google następujące dane:

• Adres e-mail
• Imię i nazwisko (nazwa profilu)
• Zdjęcie profilowe (avatar)

Dane te wykorzystujemy wyłącznie w celu utworzenia i obsługi konta użytkownika w naszym serwisie. Nie uzyskujemy dostępu do Twojej poczty Gmail, kontaktów ani innych danych z konta Google.`,
      },
      {
        heading: '10. Zmiany w polityce prywatności',
        content: `Zastrzegamy sobie prawo do aktualizacji niniejszej polityki prywatności. O istotnych zmianach poinformujemy na stronie internetowej. Zalecamy regularne zapoznawanie się z treścią polityki prywatności.`,
      },
    ],
  },
  en: {
    title: 'Privacy Policy',
    seoDescription: 'Privacy policy of Katarzyna Brui beauty salon in Białystok. Information on personal data processing in accordance with GDPR.',
    lastUpdated: 'Last updated: March 20, 2026',
    sections: [
      {
        heading: '1. Data Controller',
        content: `The controller of your personal data is Katarzyna Brui, operating as Salon Kosmetyczny Katarzyna Brui, ul. Młynowa 46, lok. U11, 15-404 Białystok, Poland.

Contact:
• Email: info@katarzynabrui.pl
• Phone: +48 880 435 102
• Address: ul. Młynowa 46, lok. U11, 15-404 Białystok, Poland`,
      },
      {
        heading: '2. Legal Basis for Processing',
        content: `We process your personal data on the following legal bases (pursuant to Art. 6(1) GDPR):

a) Consent (Art. 6(1)(a) GDPR) — for newsletter subscription, marketing communications, or use of analytical cookies.

b) Contract performance (Art. 6(1)(b) GDPR) — for booking appointments, providing beauty services, and managing user accounts.

c) Legal obligation (Art. 6(1)(c) GDPR) — to fulfill tax and accounting obligations required by law.

d) Legitimate interest (Art. 6(1)(f) GDPR) — for pursuing claims, conducting statistics, and ensuring service security.`,
      },
      {
        heading: '3. Purposes of Data Processing',
        content: `We process your personal data for the following purposes:

• Booking and providing appointments — name, email, phone number, appointment notes
• Managing user accounts — email address, password (encrypted)
• Communication — responding to inquiries, sending booking confirmations
• Marketing (with your consent) — informing about promotions and new services
• Analytics and service improvement — anonymous website usage data (Google Analytics, only after cookie consent)
• Legal obligations — issuing invoices, maintaining accounting records`,
      },
      {
        heading: '4. Data Recipients',
        content: `Your data may be shared with the following categories of recipients:

• Supabase Inc. (USA) — database and authentication services. Data transfer to the USA is based on Standard Contractual Clauses (SCC) approved by the European Commission.
• Google LLC (USA) — Google Analytics (only after cookie consent) and Google OAuth (sign-in). Transfer based on EU-US Data Privacy Framework.
• Netlify Inc. (USA) — website hosting. Transfer based on Standard Contractual Clauses.
• Booksy International sp. z o.o. — online booking system (appointment synchronization)
• Government authorities — in cases required by law (e.g., tax authorities)

We do not sell your personal data to third parties.`,
      },
      {
        heading: '5. Data Retention Period',
        content: `We store your data for the following periods:

• Booking data — for the duration of service provision and 3 years after the last visit (limitation period for service contract claims under Polish law)
• User account data — until the account is deleted by the user
• Tax and accounting data — 5 years from the end of the tax year (as required by Polish Tax Ordinance)
• Marketing data — until consent is withdrawn
• Analytical data (cookies) — maximum 26 months (Google Analytics)`,
      },
      {
        heading: '6. Your Rights',
        content: `Under the GDPR, you have the following rights:

• Right of access (Art. 15 GDPR) — obtain information about your processed data
• Right to rectification (Art. 16 GDPR) — correct inaccurate data
• Right to erasure (Art. 17 GDPR) — the "right to be forgotten"
• Right to restriction of processing (Art. 18 GDPR)
• Right to data portability (Art. 20 GDPR) — receive data in a machine-readable format
• Right to object (Art. 21 GDPR) — against processing based on legitimate interest
• Right to withdraw consent — at any time, without affecting the lawfulness of processing carried out before withdrawal

To exercise your rights, contact us at: info@katarzynabrui.pl

You also have the right to lodge a complaint with the President of the Personal Data Protection Office (PUODO):
ul. Stawki 2, 00-193 Warsaw, Poland
www.uodo.gov.pl`,
      },
      {
        heading: '7. Cookies',
        content: `Our website uses cookies:

a) Essential cookies — required for the website to function properly (user session, language preference). Legal basis: legitimate interest (Art. 6(1)(f) GDPR).

b) Analytical cookies (Google Analytics) — collect anonymous data about website usage. These are activated only after consent is given via the cookie banner.

You can manage cookie settings in your browser. Withdrawing consent for analytical cookies does not affect the functionality of the website.

We use Google Analytics with IP anonymization (send_page_view: false until consent is given). Tracking ID: G-BP257P61XY.`,
      },
      {
        heading: '8. Data Security',
        content: `We implement appropriate technical and organizational measures to protect your personal data, including:

• Encrypted connections (SSL/TLS)
• Database-level security (Row Level Security in Supabase)
• Password hashing
• Regular software updates
• HTTP security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)`,
      },
      {
        heading: '9. Google Sign-In',
        content: `We offer the option to sign in using your Google account (Google OAuth). In this case, we receive the following data from Google:

• Email address
• Name (profile name)
• Profile picture (avatar)

We use this data solely for creating and managing your user account on our website. We do not access your Gmail, contacts, or other data from your Google account.`,
      },
      {
        heading: '10. Changes to This Policy',
        content: `We reserve the right to update this privacy policy. We will inform about significant changes on our website. We recommend reviewing this policy regularly.`,
      },
    ],
  },
  ru: {
    title: 'Политика конфиденциальности',
    seoDescription: 'Политика конфиденциальности салона красоты Katarzyna Brui в Белостоке. Информация об обработке персональных данных в соответствии с GDPR.',
    lastUpdated: 'Последнее обновление: 20 марта 2026 г.',
    sections: [
      {
        heading: '1. Администратор персональных данных',
        content: `Администратором ваших персональных данных является Katarzyna Brui, ведущая предпринимательскую деятельность под названием Salon Kosmetyczny Katarzyna Brui, ул. Młynowa 46, лок. U11, 15-404 Белосток, Польша.

Контакт с администратором:
• Электронная почта: info@katarzynabrui.pl
• Телефон: +48 880 435 102
• Адрес: ul. Młynowa 46, лок. U11, 15-404 Białystok, Polska`,
      },
      {
        heading: '2. Правовые основания обработки данных',
        content: `Мы обрабатываем ваши персональные данные на следующих правовых основаниях (в соответствии со ст. 6 п. 1 GDPR):

а) Согласие (ст. 6 п. 1 лит. a GDPR) — при подписке на рассылку, маркетинговых коммуникациях или использовании аналитических cookies.

б) Исполнение договора (ст. 6 п. 1 лит. b GDPR) — при бронировании визитов, оказании косметических услуг, обслуживании учётной записи.

в) Юридическая обязанность (ст. 6 п. 1 лит. c GDPR) — для выполнения налоговых и бухгалтерских обязательств.

г) Законный интерес администратора (ст. 6 п. 1 лит. f GDPR) — для защиты прав, ведения статистики и обеспечения безопасности услуг.`,
      },
      {
        heading: '3. Цели обработки данных',
        content: `Мы обрабатываем ваши персональные данные в следующих целях:

• Бронирование и проведение визитов — имя, фамилия, электронная почта, номер телефона, примечания к визиту
• Ведение учётной записи — адрес электронной почты, пароль (зашифрованный)
• Коммуникация — ответы на запросы, отправка подтверждений бронирования
• Маркетинг (с вашего согласия) — информирование об акциях, новых услугах
• Аналитика и улучшение качества услуг — анонимные данные об использовании сайта (Google Analytics, только после согласия на cookies)
• Выполнение юридических обязательств — выставление счетов, ведение бухгалтерского учёта`,
      },
      {
        heading: '4. Получатели данных',
        content: `Ваши данные могут быть переданы следующим категориям получателей:

• Supabase Inc. (США) — услуги базы данных и авторизации. Передача данных в США осуществляется на основании стандартных договорных оговорок (SCC), утверждённых Европейской комиссией.
• Google LLC (США) — Google Analytics (только после согласия на cookies) и Google OAuth (вход через Google). Передача на основании EU-US Data Privacy Framework.
• Netlify Inc. (США) — хостинг веб-сайта. Передача на основании стандартных договорных оговорок.
• Booksy International sp. z o.o. — система онлайн-бронирования (синхронизация визитов)
• Государственные органы — в случаях, предусмотренных законом (напр., налоговая служба)

Мы не продаём ваши персональные данные третьим лицам.`,
      },
      {
        heading: '5. Сроки хранения данных',
        content: `Мы храним ваши данные в течение следующих периодов:

• Данные бронирования — в течение срока оказания услуги и 3 лет после последнего визита (срок давности по договору оказания услуг)
• Данные учётной записи — до момента удаления учётной записи пользователем
• Налоговые и бухгалтерские данные — 5 лет с конца налогового года (в соответствии с Налоговым кодексом Польши)
• Маркетинговые данные — до момента отзыва согласия
• Аналитические данные (cookies) — максимум 26 месяцев (Google Analytics)`,
      },
      {
        heading: '6. Ваши права',
        content: `В соответствии с GDPR вам принадлежат следующие права:

• Право на доступ (ст. 15 GDPR) — получение информации об обрабатываемых данных
• Право на исправление (ст. 16 GDPR) — исправление неточных данных
• Право на удаление (ст. 17 GDPR) — так называемое «право на забвение»
• Право на ограничение обработки (ст. 18 GDPR)
• Право на переносимость данных (ст. 20 GDPR) — в машиночитаемом формате
• Право на возражение (ст. 21 GDPR) — против обработки на основании законного интереса
• Право на отзыв согласия — в любой момент, без влияния на законность обработки, проведённой до отзыва

Для реализации своих прав свяжитесь с нами: info@katarzynabrui.pl

Вы также имеете право подать жалобу Председателю Управления по защите персональных данных (PUODO):
ul. Stawki 2, 00-193 Warszawa, Polska
www.uodo.gov.pl`,
      },
      {
        heading: '7. Файлы cookies',
        content: `Наш сайт использует файлы cookies:

а) Необходимые cookies — требуются для корректной работы сайта (сессия пользователя, языковые настройки). Основание: законный интерес (ст. 6 п. 1 лит. f GDPR).

б) Аналитические cookies (Google Analytics) — собирают анонимные данные об использовании сайта. Активируются только после согласия через баннер cookies.

Вы можете управлять настройками cookies в своём браузере. Отзыв согласия на аналитические cookies не влияет на работу сайта.

Мы используем Google Analytics с анонимизацией IP-адресов (send_page_view: false до момента согласия). Идентификатор отслеживания: G-BP257P61XY.`,
      },
      {
        heading: '8. Безопасность данных',
        content: `Мы применяем соответствующие технические и организационные меры для защиты ваших персональных данных, включая:

• Шифрование соединений (SSL/TLS)
• Защита на уровне базы данных (Row Level Security в Supabase)
• Хеширование паролей
• Регулярные обновления программного обеспечения
• Заголовки безопасности HTTP (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)`,
      },
      {
        heading: '9. Вход через Google',
        content: `Мы предлагаем возможность входа с помощью учётной записи Google (Google OAuth). В этом случае мы получаем от Google следующие данные:

• Адрес электронной почты
• Имя (имя профиля)
• Фото профиля (аватар)

Мы используем эти данные исключительно для создания и обслуживания вашей учётной записи на нашем сайте. Мы не получаем доступ к вашей почте Gmail, контактам или другим данным вашей учётной записи Google.`,
      },
      {
        heading: '10. Изменения в политике конфиденциальности',
        content: `Мы оставляем за собой право обновлять настоящую политику конфиденциальности. О существенных изменениях мы сообщим на сайте. Рекомендуем регулярно ознакомляться с содержанием политики конфиденциальности.`,
      },
    ],
  },
};

export const PrivacyPolicyPage: React.FC = () => {
  const { language } = useLanguage();
  const t = content[language];

  React.useEffect(() => { prerenderReady(); }, []);

  return (
    <>
      <SEO
        title={t.title}
        description={t.seoDescription}
        canonical="/privacy-policy"
        keywords={language === 'pl'
          ? ['polityka prywatności', 'RODO', 'ochrona danych osobowych', 'salon kosmetyczny Białystok']
          : language === 'en'
          ? ['privacy policy', 'GDPR', 'data protection', 'beauty salon Białystok']
          : ['политика конфиденциальности', 'GDPR', 'защита данных', 'салон красоты Белосток']
        }
      />
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
          <p className="text-sm text-gray-500 mb-8">{t.lastUpdated}</p>

          <div className="bg-white rounded-2xl shadow-sm p-6 md:p-10 space-y-8">
            {t.sections.map((section, i) => (
              <section key={i}>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">{section.heading}</h2>
                <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                  {section.content}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-8 text-center">
            <LocalizedLink to="/" className="text-amber-600 hover:text-amber-700 text-sm font-medium">
              {language === 'pl' ? 'Powrót do strony głównej' : language === 'en' ? 'Back to homepage' : 'Вернуться на главную'}
            </LocalizedLink>
          </div>
        </div>
      </div>
    </>
  );
};
