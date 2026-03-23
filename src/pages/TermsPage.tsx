import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { SEO } from '../components/SEO';
import { LocalizedLink } from '../components/LocalizedLink';
import { prerenderReady } from '../utils/prerenderReady';

const content = {
  pl: {
    title: 'Regulamin',
    seoDescription: 'Regulamin salonu kosmetycznego Katarzyna Brui w Białymstoku. Warunki rezerwacji, świadczenia usług i korzystania ze strony internetowej.',
    lastUpdated: 'Ostatnia aktualizacja: 20 marca 2026 r.',
    sections: [
      {
        heading: '1. Postanowienia ogólne',
        content: `Niniejszy regulamin określa zasady korzystania ze strony internetowej katarzynabrui.pl oraz warunki świadczenia usług kosmetycznych przez Salon Kosmetyczny Katarzyna Brui.

Usługodawca: Katarzyna Brui, prowadząca działalność gospodarczą pod nazwą Salon Kosmetyczny Katarzyna Brui
Adres: ul. Młynowa 46, lok. U11, 15-404 Białystok
NIP: 5423506689
Kontakt: info@katarzynabrui.pl, tel. +48 880 435 102

Regulamin jest udostępniony nieodpłatnie na stronie internetowej w formie umożliwiającej jego pobranie, utrwalenie i wydrukowanie.`,
      },
      {
        heading: '2. Definicje',
        content: `• Salon — Salon Kosmetyczny Katarzyna Brui przy ul. Młynowej 46, lok. U11, 15-404 Białystok
• Klient — osoba fizyczna korzystająca z usług Salonu lub strony internetowej
• Usługa — zabieg kosmetyczny świadczony przez Salon
• Serwis — strona internetowa katarzynabrui.pl
• Rezerwacja — umówienie wizyty za pośrednictwem Serwisu lub systemu Booksy`,
      },
      {
        heading: '3. Rezerwacja wizyt',
        content: `3.1. Rezerwacja wizyty jest możliwa za pośrednictwem:
• Strony internetowej katarzynabrui.pl
• Systemu rezerwacji Booksy
• Kontaktu telefonicznego: +48 880 435 102

3.2. Dokonanie rezerwacji online wymaga podania: imienia, adresu e-mail oraz numeru telefonu.

3.3. Potwierdzenie rezerwacji następuje automatycznie drogą e-mailową. Rezerwacja stanowi zawarcie umowy o świadczenie usługi na warunkach określonych w niniejszym regulaminie.

3.4. Klient zobowiązany jest do przybycia na wizytę punktualnie. W przypadku spóźnienia powyżej 15 minut Salon zastrzega sobie prawo do skrócenia zabiegu lub odmowy jego wykonania.

3.5. W przypadku chęci odwołania lub przełożenia wizyty, prosimy o kontakt co najmniej 24 godziny przed planowanym terminem.`,
      },
      {
        heading: '4. Świadczenie usług',
        content: `4.1. Usługi kosmetyczne świadczone są przez wykwalifikowany personel z wykorzystaniem profesjonalnych produktów i sprzętu.

4.2. Przed wykonaniem zabiegu Klient jest informowany o jego przebiegu, ewentualnych przeciwwskazaniach i zaleceniach pozabiegowych.

4.3. Klient zobowiązany jest do poinformowania o:
• Chorobach skóry, alergiach i stanach zdrowia mogących stanowić przeciwwskazanie do zabiegu
• Przyjmowanych lekach mogących wpływać na przebieg zabiegu
• Ciąży lub karmieniu piersią

4.4. Salon zastrzega sobie prawo do odmowy wykonania zabiegu w przypadku stwierdzenia przeciwwskazań zdrowotnych lub niespełnienia warunków do bezpiecznego wykonania usługi.

4.5. Efekty zabiegów mogą się różnić w zależności od indywidualnych cech organizmu Klienta. Zdjęcia w galerii i materiałach marketingowych mają charakter poglądowy.`,
      },
      {
        heading: '5. Ceny i płatności',
        content: `5.1. Aktualne ceny usług podane są na stronie internetowej w zakładce „Cennik" / „Zabiegi" oraz w systemie rezerwacji.

5.2. Ceny podane są w złotych polskich (PLN) i zawierają podatek VAT (jeśli dotyczy).

5.3. Płatność za usługi odbywa się po wykonaniu zabiegu:
• Gotówką
• Kartą płatniczą

5.4. Salon zastrzega sobie prawo do zmiany cennika. Zmiana cen nie dotyczy usług już zarezerwowanych.`,
      },
      {
        heading: '6. Reklamacje',
        content: `6.1. Klient ma prawo do złożenia reklamacji dotyczącej wykonanej usługi w terminie 14 dni od dnia jej wykonania.

6.2. Reklamację można złożyć:
• Osobiście w Salonie
• E-mailem na adres: info@katarzynabrui.pl
• Listownie na adres Salonu

6.3. Reklamacja powinna zawierać: imię i nazwisko Klienta, datę wykonania usługi, opis zastrzeżeń oraz oczekiwany sposób rozwiązania.

6.4. Salon rozpatrzy reklamację w terminie 14 dni od daty jej otrzymania i poinformuje Klienta o wyniku drogą e-mailową lub telefoniczną.

6.5. W przypadku uzasadnionej reklamacji Salon zaproponuje bezpłatną korektę zabiegu lub zwrot części/całości uiszczonej ceny.`,
      },
      {
        heading: '7. Prawo odstąpienia od umowy',
        content: `7.1. Zgodnie z art. 38 pkt 1 ustawy z dnia 30 maja 2014 r. o prawach konsumenta, prawo odstąpienia od umowy zawartej na odległość nie przysługuje w odniesieniu do umów o świadczenie usług, jeżeli usługodawca wykonał w pełni usługę za wyraźną i uprzednią zgodą konsumenta, który został poinformowany przed rozpoczęciem świadczenia, że po spełnieniu świadczenia utraci prawo odstąpienia.

7.2. Klient może odwołać rezerwację (odstąpić od umowy przed wykonaniem usługi) na zasadach określonych w punkcie 3.5.

7.3. W przypadku rezerwacji online — Klient dokonując rezerwacji, wyraża zgodę na rozpoczęcie świadczenia usługi przed upływem terminu do odstąpienia od umowy.`,
      },
      {
        heading: '8. Konto użytkownika',
        content: `8.1. Rejestracja konta w Serwisie jest dobrowolna i bezpłatna.

8.2. Konto umożliwia:
• Rezerwację wizyt online
• Przeglądanie historii wizyt
• Zarządzanie danymi osobowymi

8.3. Klient odpowiada za zachowanie poufności danych logowania. W przypadku podejrzenia nieuprawnionego dostępu należy niezwłocznie zmienić hasło i poinformować Salon.

8.4. Klient może w każdej chwili usunąć konto, kontaktując się z Salonem na adres info@katarzynabrui.pl. Usunięcie konta skutkuje usunięciem danych osobowych, z wyjątkiem danych, których przechowywanie wynika z przepisów prawa.`,
      },
      {
        heading: '9. Korzystanie z serwisu internetowego',
        content: `9.1. Korzystanie z Serwisu wymaga:
• Urządzenia z dostępem do internetu
• Aktualnej przeglądarki internetowej z włączoną obsługą JavaScript i cookies

9.2. Zabrania się korzystania z Serwisu w sposób sprzeczny z prawem, dobrymi obyczajami lub naruszający prawa osób trzecich.

9.3. Treści zamieszczone w Serwisie (zdjęcia, teksty, grafiki) stanowią własność Salonu lub są wykorzystywane na podstawie licencji. Ich kopiowanie lub rozpowszechnianie bez zgody jest zabronione.`,
      },
      {
        heading: '10. Odpowiedzialność',
        content: `10.1. Salon dokłada wszelkich starań, aby informacje zamieszczone w Serwisie były aktualne i prawidłowe, jednak nie ponosi odpowiedzialności za ewentualne błędy lub nieaktualność treści.

10.2. Salon nie ponosi odpowiedzialności za przerwy w dostępie do Serwisu wynikające z przyczyn technicznych, konserwacji systemu lub działania siły wyższej.

10.3. Salon ponosi odpowiedzialność za wykonane usługi na zasadach ogólnych wynikających z Kodeksu cywilnego.`,
      },
      {
        heading: '11. Ochrona danych osobowych',
        content: `Zasady przetwarzania danych osobowych zostały szczegółowo opisane w Polityce Prywatności dostępnej pod adresem katarzynabrui.pl/privacy-policy.`,
      },
      {
        heading: '12. Pozasądowe rozwiązywanie sporów',
        content: `12.1. Klient będący konsumentem ma możliwość skorzystania z pozasądowych sposobów rozpatrywania reklamacji i dochodzenia roszczeń:
• Zwrócenie się do wojewódzkiego inspektora Inspekcji Handlowej z wnioskiem o wszczęcie postępowania mediacyjnego
• Zwrócenie się do stałego polubownego sądu konsumenckiego przy wojewódzkim inspektorze Inspekcji Handlowej
• Skorzystanie z platformy ODR (Online Dispute Resolution) dostępnej pod adresem: https://ec.europa.eu/consumers/odr

12.2. Szczegółowe informacje dotyczące pozasądowego rozwiązywania sporów dostępne są na stronie UOKiK: https://www.uokik.gov.pl`,
      },
      {
        heading: '13. Postanowienia końcowe',
        content: `13.1. Salon zastrzega sobie prawo do zmiany niniejszego regulaminu. O zmianach Klienci zostaną poinformowani na stronie internetowej.

13.2. Zmiana regulaminu nie wpływa na rezerwacje dokonane przed datą zmiany.

13.3. W sprawach nieuregulowanych niniejszym regulaminem zastosowanie mają przepisy prawa polskiego, w szczególności Kodeksu cywilnego oraz ustawy o prawach konsumenta.

13.4. Regulamin wchodzi w życie z dniem 20 marca 2026 r.`,
      },
    ],
  },
  en: {
    title: 'Terms and Conditions',
    seoDescription: 'Terms and conditions of Katarzyna Brui beauty salon in Białystok. Booking conditions, service provision, and website usage terms.',
    lastUpdated: 'Last updated: March 20, 2026',
    sections: [
      {
        heading: '1. General Provisions',
        content: `These terms and conditions govern the use of the katarzynabrui.pl website and the conditions for providing beauty services by Salon Kosmetyczny Katarzyna Brui.

Service provider: Katarzyna Brui, operating as Salon Kosmetyczny Katarzyna Brui
Address: ul. Młynowa 46, lok. U11, 15-404 Białystok, Poland
Contact: info@katarzynabrui.pl, phone: +48 880 435 102

These terms are made available free of charge on the website in a format that allows downloading, saving, and printing.`,
      },
      {
        heading: '2. Definitions',
        content: `• Salon — Salon Kosmetyczny Katarzyna Brui at ul. Młynowa 46, lok. U11, 15-404 Białystok
• Client — a natural person using the Salon's services or website
• Service — a beauty treatment provided by the Salon
• Website — the katarzynabrui.pl website
• Booking — scheduling an appointment through the Website or Booksy system`,
      },
      {
        heading: '3. Booking Appointments',
        content: `3.1. Appointments can be booked through:
• The website katarzynabrui.pl
• The Booksy booking system
• Phone: +48 880 435 102

3.2. Online booking requires providing: first name, email address, and phone number.

3.3. Booking confirmation is sent automatically by email. A booking constitutes a contract for service provision under these terms.

3.4. The Client is required to arrive on time. If the Client is more than 15 minutes late, the Salon reserves the right to shorten the treatment or refuse to perform it.

3.5. To cancel or reschedule, please contact us at least 24 hours before the scheduled appointment.`,
      },
      {
        heading: '4. Service Provision',
        content: `4.1. Beauty services are provided by qualified staff using professional products and equipment.

4.2. Before performing a treatment, the Client is informed about the procedure, potential contraindications, and post-treatment recommendations.

4.3. The Client is obliged to inform about:
• Skin conditions, allergies, and health conditions that may be contraindications
• Medications that may affect the treatment
• Pregnancy or breastfeeding

4.4. The Salon reserves the right to refuse treatment if health contraindications are identified or if conditions for safe service are not met.

4.5. Treatment results may vary depending on the Client's individual characteristics. Photos in the gallery and marketing materials are illustrative.`,
      },
      {
        heading: '5. Prices and Payments',
        content: `5.1. Current service prices are listed on the website under "Prices" / "Services" and in the booking system.

5.2. Prices are in Polish złoty (PLN) and include VAT (if applicable).

5.3. Payment is made after the treatment:
• Cash
• Payment card

5.4. The Salon reserves the right to change prices. Price changes do not apply to already booked services.`,
      },
      {
        heading: '6. Complaints',
        content: `6.1. The Client has the right to file a complaint about a service within 14 days of its performance.

6.2. Complaints can be submitted:
• In person at the Salon
• By email to: info@katarzynabrui.pl
• By mail to the Salon address

6.3. A complaint should include: Client's name, date of service, description of concerns, and expected resolution.

6.4. The Salon will process the complaint within 14 days of receipt and inform the Client of the outcome by email or phone.

6.5. In case of a justified complaint, the Salon will offer a free correction or a partial/full refund.`,
      },
      {
        heading: '7. Right of Withdrawal',
        content: `7.1. In accordance with Art. 38(1) of the Polish Consumer Rights Act of May 30, 2014, the right of withdrawal from a distance contract does not apply to service contracts where the service has been fully performed with the consumer's prior express consent and acknowledgment that the right of withdrawal will be lost upon full performance.

7.2. The Client may cancel a booking (withdraw before service is performed) according to the terms in section 3.5.

7.3. By making an online booking, the Client consents to the commencement of service before the withdrawal period expires.`,
      },
      {
        heading: '8. User Account',
        content: `8.1. Account registration on the Website is voluntary and free of charge.

8.2. An account enables:
• Online appointment booking
• Viewing appointment history
• Managing personal data

8.3. The Client is responsible for keeping login credentials confidential. In case of suspected unauthorized access, the password should be changed immediately and the Salon informed.

8.4. The Client may delete their account at any time by contacting the Salon at info@katarzynabrui.pl. Account deletion results in the removal of personal data, except for data required to be retained by law.`,
      },
      {
        heading: '9. Website Usage',
        content: `9.1. Using the Website requires:
• A device with internet access
• A current web browser with JavaScript and cookies enabled

9.2. Using the Website in a manner contrary to law, good customs, or violating the rights of third parties is prohibited.

9.3. Content on the Website (photos, texts, graphics) is owned by the Salon or used under license. Copying or distributing without permission is prohibited.`,
      },
      {
        heading: '10. Liability',
        content: `10.1. The Salon makes every effort to ensure the information on the Website is current and accurate, but is not responsible for any errors or outdated content.

10.2. The Salon is not liable for interruptions in Website access due to technical reasons, system maintenance, or force majeure.

10.3. The Salon is liable for services provided under the general principles of the Polish Civil Code.`,
      },
      {
        heading: '11. Personal Data Protection',
        content: `The rules for processing personal data are detailed in the Privacy Policy available at katarzynabrui.pl/privacy-policy.`,
      },
      {
        heading: '12. Out-of-Court Dispute Resolution',
        content: `12.1. Clients who are consumers may use out-of-court methods of handling complaints and pursuing claims:
• Applying to the voivodeship inspector of the Trade Inspection for mediation proceedings
• Applying to the permanent consumer arbitration court at the voivodeship inspector of the Trade Inspection
• Using the ODR (Online Dispute Resolution) platform available at: https://ec.europa.eu/consumers/odr

12.2. Detailed information on out-of-court dispute resolution is available on the UOKiK website: https://www.uokik.gov.pl`,
      },
      {
        heading: '13. Final Provisions',
        content: `13.1. The Salon reserves the right to amend these terms and conditions. Clients will be informed of changes on the website.

13.2. Changes to the terms do not affect bookings made before the date of the change.

13.3. Matters not regulated by these terms are governed by Polish law, in particular the Civil Code and the Consumer Rights Act.

13.4. These terms and conditions come into effect on March 20, 2026.`,
      },
    ],
  },
  ru: {
    title: 'Правила и условия',
    seoDescription: 'Правила и условия салона красоты Katarzyna Brui в Белостоке. Условия бронирования, оказания услуг и использования сайта.',
    lastUpdated: 'Последнее обновление: 20 марта 2026 г.',
    sections: [
      {
        heading: '1. Общие положения',
        content: `Настоящие правила определяют условия использования веб-сайта katarzynabrui.pl и условия оказания косметических услуг салоном Salon Kosmetyczny Katarzyna Brui.

Поставщик услуг: Katarzyna Brui, осуществляющая предпринимательскую деятельность под названием Salon Kosmetyczny Katarzyna Brui
Адрес: ul. Młynowa 46, лок. U11, 15-404 Białystok, Polska
Контакт: info@katarzynabrui.pl, тел. +48 880 435 102

Настоящие правила предоставляются бесплатно на веб-сайте в формате, позволяющем их скачивание, сохранение и печать.`,
      },
      {
        heading: '2. Определения',
        content: `• Салон — Salon Kosmetyczny Katarzyna Brui, ул. Młynowa 46, лок. U11, 15-404 Белосток
• Клиент — физическое лицо, пользующееся услугами Салона или веб-сайтом
• Услуга — косметическая процедура, оказываемая Салоном
• Сайт — веб-сайт katarzynabrui.pl
• Бронирование — запись на визит через Сайт или систему Booksy`,
      },
      {
        heading: '3. Бронирование визитов',
        content: `3.1. Запись на визит возможна через:
• Веб-сайт katarzynabrui.pl
• Систему бронирования Booksy
• Телефон: +48 880 435 102

3.2. Онлайн-бронирование требует указания: имени, адреса электронной почты и номера телефона.

3.3. Подтверждение бронирования отправляется автоматически по электронной почте. Бронирование является заключением договора на оказание услуги на условиях настоящих правил.

3.4. Клиент обязан прибыть на визит вовремя. В случае опоздания более чем на 15 минут Салон оставляет за собой право сократить процедуру или отказать в её проведении.

3.5. Для отмены или переноса визита просим связаться с нами не менее чем за 24 часа до назначенного времени.`,
      },
      {
        heading: '4. Оказание услуг',
        content: `4.1. Косметические услуги оказываются квалифицированным персоналом с использованием профессиональных продуктов и оборудования.

4.2. Перед проведением процедуры Клиент информируется о её ходе, возможных противопоказаниях и рекомендациях после процедуры.

4.3. Клиент обязан сообщить о:
• Кожных заболеваниях, аллергиях и состояниях здоровья, которые могут являться противопоказаниями
• Принимаемых лекарствах, которые могут повлиять на процедуру
• Беременности или кормлении грудью

4.4. Салон оставляет за собой право отказать в проведении процедуры при выявлении противопоказаний по здоровью или несоблюдении условий для безопасного оказания услуги.

4.5. Результаты процедур могут различаться в зависимости от индивидуальных особенностей организма Клиента. Фотографии в галерее и рекламных материалах носят иллюстративный характер.`,
      },
      {
        heading: '5. Цены и оплата',
        content: `5.1. Актуальные цены на услуги указаны на сайте в разделе «Прайс-лист» / «Услуги» и в системе бронирования.

5.2. Цены указаны в польских злотых (PLN) и включают НДС (если применимо).

5.3. Оплата за услуги производится после выполнения процедуры:
• Наличными
• Платёжной картой

5.4. Салон оставляет за собой право изменять прайс-лист. Изменение цен не распространяется на уже забронированные услуги.`,
      },
      {
        heading: '6. Рекламации',
        content: `6.1. Клиент имеет право подать рекламацию на выполненную услугу в течение 14 дней со дня её оказания.

6.2. Рекламацию можно подать:
• Лично в Салоне
• По электронной почте: info@katarzynabrui.pl
• Почтой на адрес Салона

6.3. Рекламация должна содержать: имя и фамилию Клиента, дату оказания услуги, описание замечаний и ожидаемый способ решения.

6.4. Салон рассмотрит рекламацию в течение 14 дней с момента её получения и сообщит Клиенту о результате по электронной почте или телефону.

6.5. В случае обоснованной рекламации Салон предложит бесплатную коррекцию процедуры или возврат части/полной суммы.`,
      },
      {
        heading: '7. Право отказа от договора',
        content: `7.1. В соответствии со ст. 38 п. 1 Закона Польши о правах потребителей от 30 мая 2014 г., право отказа от договора, заключённого дистанционно, не применяется к договорам на оказание услуг, если услуга была полностью оказана с предварительного явного согласия потребителя, который был проинформирован о том, что после исполнения услуги он утратит право отказа.

7.2. Клиент может отменить бронирование (отказаться от договора до оказания услуги) на условиях, указанных в пункте 3.5.

7.3. Осуществляя онлайн-бронирование, Клиент даёт согласие на начало оказания услуги до истечения срока отказа от договора.`,
      },
      {
        heading: '8. Учётная запись пользователя',
        content: `8.1. Регистрация учётной записи на Сайте является добровольной и бесплатной.

8.2. Учётная запись позволяет:
• Бронировать визиты онлайн
• Просматривать историю визитов
• Управлять персональными данными

8.3. Клиент несёт ответственность за сохранение конфиденциальности данных для входа. При подозрении на несанкционированный доступ следует немедленно изменить пароль и сообщить Салону.

8.4. Клиент может в любой момент удалить учётную запись, связавшись с Салоном по адресу info@katarzynabrui.pl. Удаление учётной записи влечёт удаление персональных данных, за исключением данных, хранение которых требуется по закону.`,
      },
      {
        heading: '9. Использование сайта',
        content: `9.1. Для использования Сайта необходимо:
• Устройство с доступом в интернет
• Актуальный веб-браузер с включённой поддержкой JavaScript и cookies

9.2. Запрещается использование Сайта способом, противоречащим законодательству, добрым обычаям или нарушающим права третьих лиц.

9.3. Содержимое Сайта (фотографии, тексты, графика) является собственностью Салона или используется на основании лицензии. Копирование или распространение без разрешения запрещено.`,
      },
      {
        heading: '10. Ответственность',
        content: `10.1. Салон прилагает все усилия для поддержания актуальности и точности информации на Сайте, однако не несёт ответственности за возможные ошибки или неактуальность содержимого.

10.2. Салон не несёт ответственности за перебои в доступе к Сайту, вызванные техническими причинами, обслуживанием системы или обстоятельствами непреодолимой силы.

10.3. Салон несёт ответственность за оказанные услуги на общих основаниях, предусмотренных Гражданским кодексом Польши.`,
      },
      {
        heading: '11. Защита персональных данных',
        content: `Правила обработки персональных данных подробно описаны в Политике конфиденциальности, доступной по адресу katarzynabrui.pl/privacy-policy.`,
      },
      {
        heading: '12. Внесудебное разрешение споров',
        content: `12.1. Клиент, являющийся потребителем, может воспользоваться внесудебными способами рассмотрения рекламаций и предъявления претензий:
• Обращение к воеводскому инспектору Торговой инспекции с заявлением о возбуждении медиационного производства
• Обращение в постоянный потребительский арбитражный суд при воеводском инспекторе Торговой инспекции
• Использование платформы ODR (онлайн-разрешение споров): https://ec.europa.eu/consumers/odr

12.2. Подробная информация о внесудебном разрешении споров доступна на сайте UOKiK: https://www.uokik.gov.pl`,
      },
      {
        heading: '13. Заключительные положения',
        content: `13.1. Салон оставляет за собой право изменять настоящие правила. Об изменениях Клиенты будут проинформированы на веб-сайте.

13.2. Изменение правил не влияет на бронирования, сделанные до даты изменения.

13.3. В вопросах, не урегулированных настоящими правилами, применяется законодательство Польши, в частности Гражданский кодекс и Закон о правах потребителей.

13.4. Настоящие правила вступают в силу 20 марта 2026 г.`,
      },
    ],
  },
};

export const TermsPage: React.FC = () => {
  const { language } = useLanguage();
  const t = content[language];

  React.useEffect(() => { prerenderReady(); }, []);

  return (
    <>
      <SEO
        title={t.title}
        description={t.seoDescription}
        canonical="/terms"
        keywords={language === 'pl'
          ? ['regulamin', 'warunki użytkowania', 'salon kosmetyczny', 'rezerwacja wizyt Białystok']
          : language === 'en'
          ? ['terms and conditions', 'terms of use', 'beauty salon', 'booking Białystok']
          : ['правила и условия', 'условия использования', 'салон красоты', 'бронирование Белосток']
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
