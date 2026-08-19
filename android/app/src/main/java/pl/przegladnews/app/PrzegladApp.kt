package pl.przegladnews.app

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import java.util.concurrent.TimeUnit

/**
 * Punkt startowy aplikacji: kanał powiadomień i cykliczne sprawdzanie wydań.
 *
 * Wydanie powstaje o 8:00, ale telefon bywa wtedy offline albo uśpiony, więc
 * zamiast celować w konkretną godzinę pytamy o nie co kilka godzin. WorkManager
 * sam dobiera moment, w którym nie zaszkodzi to baterii.
 */
class PrzegladApp : Application() {

    override fun onCreate() {
        super.onCreate()
        utworzKanal()
        zaplanujSprawdzanie()
    }

    private fun utworzKanal() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val kanal = NotificationChannel(
            KANAL_WYDANIA,
            getString(R.string.kanal_wydania),
            NotificationManager.IMPORTANCE_DEFAULT,
        ).apply {
            description = getString(R.string.kanal_wydania_opis)
            setShowBadge(true)
        }
        getSystemService(NotificationManager::class.java).createNotificationChannel(kanal)
    }

    private fun zaplanujSprawdzanie() {
        val warunki = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        val praca = PeriodicWorkRequestBuilder<SprawdzWydanieWorker>(3, TimeUnit.HOURS)
            .setConstraints(warunki)
            .setInitialDelay(15, TimeUnit.MINUTES)
            .build()

        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            PRACA_SPRAWDZANIE,
            ExistingPeriodicWorkPolicy.KEEP,
            praca,
        )
    }

    companion object {
        const val KANAL_WYDANIA = "wydania"
        const val PRACA_SPRAWDZANIE = "sprawdz-wydanie"
        const val USTAWIENIA = "przeglad"
        const val KLUCZ_OSTATNIE = "ostatnie-wydanie"
    }
}
