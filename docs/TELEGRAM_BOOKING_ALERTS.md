# Alerty Telegram dla rezerwacji

Aplikacja wysyła wiadomość Telegram w dwóch przypadkach: po każdej nowej rezerwacji złożonej przez formularz na stronie oraz po każdej nowej rezerwacji Booksy oznaczonej w istniejącej konfiguracji jako **rezerwacja kompleksowa**. Zmiany terminu i anulowania nie generują nowych alertów.

## Bezpieczna konfiguracja wdrożenia

W panelu hostingu należy dodać poniższe zmienne środowiskowe dla wszystkich kontekstów produkcyjnych. Nie wolno dodawać tych wartości do repozytorium, plików `VITE_*` ani kodu uruchamianego w przeglądarce.

| Zmienna | Wartość | Przeznaczenie |
| --- | --- | --- |
| `TELEGRAM_BOT_TOKEN` | aktualny token bota otrzymany z BotFather | Uwierzytelnia wyłącznie serwer podczas wywołania API Telegram. |
| `TELEGRAM_CHAT_ID` | numeryczny identyfikator prywatnego czatu użytkownika `@Pavel_brui` | Wskazuje prywatny czat, do którego mają trafiać alerty. |

> Telegram wymaga dla prywatnej wiadomości **numerycznego identyfikatora czatu**, a nie samej nazwy użytkownika. Użytkownik musi najpierw otworzyć rozmowę z botem i wysłać `/start`.

## Ustalenie identyfikatora czatu

Po wysłaniu `/start` do bota należy odczytać najnowszą aktualizację przez metodę `getUpdates` API Telegram i użyć wartości `message.chat.id` jako `TELEGRAM_CHAT_ID`. Jeżeli bot ma już skonfigurowany webhook, należy odczytać identyfikator z systemu obsługującego ten webhook zamiast korzystać z `getUpdates`.

## Treść alertu

Każdy alert zawiera źródło rezerwacji, dane kontaktowe klienta, usługę, termin, stylistkę oraz — jeżeli dostępna — cenę. Token bota nie jest przekazywany do przeglądarki: rezerwacja z witryny wywołuje zabezpieczoną funkcję serwerową ze zwykłym tokenem sesji klienta, a rezerwacja Booksy jest obsługiwana bezpośrednio przez istniejącą funkcję serwerową integracji.

## Sprawdzenie po wdrożeniu

Po dodaniu zmiennych środowiskowych należy wykonać nową rezerwację testową przez stronę. Następnie należy dodać w Booksy rezerwację usługi oznaczonej w panelu jako kompleksowa; po odebraniu jej przez istniejącą integrację powinna dotrzeć druga wiadomość Telegram.
