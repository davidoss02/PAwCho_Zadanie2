# PAwCho_Zadanie2

W ramach rozwiązania zaimplementowano łańcuch dostarczania oprogramowania, który automatyzuje konteneryzację aplikacji z Zadania 1. Workflow składa się z następujących etapów:
1.Konfiguracja środowisk QEMU i Docker Buildx do obsługi wielu architektur.
2.Logowanie do zewnętrznych rejestrów (DockerHub dla cache, GHCR dla obrazów).
3.Testowa budowa obrazu oraz jego skanowanie pod kątem podatności CVE.
4.Publikacja bezpiecznego, wieloarchitekturowego obrazu w publicznym rejestrze.

Przyjęto standard oznaczania obrazów produkcyjnych w ghcr.io za pomocą dwóch tagów. Pierwszym jest dynamicznie generowany skrót SHA z repozytorium kodu. Dodatkowo najnowsza wersja na gałęzi głównej otrzymuje tag latest w celu uproszczenia pobierania. 
Dane podręczne (cache) trafiają na DockerHub pod niezmiennym tagiem buildcache, co pozwala na ciągłe nadpisywanie starych warstw bez tworzenia zbędnych artefaktów w rejestrze. Wykorzystanie trybu max dla cache'u znacząco redukuje czas wykonywania akcji.

Do weryfikacji bezpieczeństwa wykorzystano skaner Docker Scout. Jego bezpośrednia integracja z narzędziami Docker sprawia, że jest to najprostsze w utrzymaniu rozwiązanie. Skaner został skonfigurowany tak, aby blokować wysyłkę obrazów na ghcr.io, jeśli aplikacja lub jej zależności (node_modules) będą zawierać luki sklasyfikowane jako HIGH lub CRITICAL. Wymusiło to odpowiednią optymalizację samego pliku Dockerfile, dlatego w historii widnieje aż 5 commitów.
