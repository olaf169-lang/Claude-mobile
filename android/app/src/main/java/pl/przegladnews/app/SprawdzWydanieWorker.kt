package pl.przegladnews.app

import android.Manifest
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.work.Worker
import androidx.work.WorkerParameters
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

/**
 * Sprawdza, czy pod adresem przeglądu pojawiło się wydanie nowsze niż ostatnio
 * pokazane, i jeśli tak — wysyła jedno powiadomienie z czołowym tematem.
 */
class SprawdzWydanieWorker(
    context: Context,
    params: WorkerParameters,
) : Worker(context, params) {

    override fun doWork(): Result {
        val wydanie = pobierzWydanie() ?: return Result.retry()

        val numer = wydanie.optString("wydanie")
        if (numer.isEmpty()) return Result.success()

        val ustawienia = applicationContext
            .getSharedPreferences(PrzegladApp.USTAWIENIA, Context.MODE_PRIVATE)
        if (numer == ustawienia.getString(PrzegladApp.KLUCZ_OSTATNIE, null)) {
            return Result.success()
        }

        powiadom(numer, wydanie)
        ustawienia.edit().putString(PrzegladApp.KLUCZ_OSTATNIE, numer).apply()
        return Result.success()
    }

    private fun pobierzWydanie(): JSONObject? {
        val adres = BuildConfig.PRZEGLAD_URL.trimEnd('/') + "/data/latest.json"
        return try {
            val polaczenie = (URL(adres).openConnection() as HttpURLConnection).apply {
                connectTimeout = 15_000
                readTimeout = 15_000
                setRequestProperty("Accept", "application/json")
                setRequestProperty("Cache-Control", "no-cache")
            }
            try {
                if (polaczenie.responseCode != HttpURLConnection.HTTP_OK) return null
                JSONObject(polaczenie.inputStream.bufferedReader().use { it.readText() })
            } finally {
                polaczenie.disconnect()
            }
        } catch (blad: Exception) {
            Log.w(TAG, "nie udało się pobrać wydania: ${blad.message}")
            null
        }
    }

    private fun powiadom(numer: String, wydanie: JSONObject) {
        val menedzer = NotificationManagerCompat.from(applicationContext)
        val maZgode = ContextCompat.checkSelfPermission(
            applicationContext, Manifest.permission.POST_NOTIFICATIONS,
        ) == PackageManager.PERMISSION_GRANTED
        if (!maZgode && android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            return
        }

        val dzien = wydanie.optString("dotyczy_dnia").ifEmpty { numer }
        val pozycje = wydanie.optJSONArray("pozycje")
        val czolowy = pozycje?.optJSONObject(0)?.optString("nagłówek").orEmpty()
        val dzialy = buildList {
            for (i in 0 until (pozycje?.length() ?: 0)) {
                pozycje?.optJSONObject(i)?.optJSONObject("dział")?.optString("nazwa")
                    ?.takeIf { it.isNotEmpty() }?.let { add(it) }
            }
        }

        val tresc = buildString {
            if (czolowy.isNotEmpty()) appendLine(czolowy)
            append("${dzialy.size} tematów: ")
            append(dzialy.take(4).joinToString(", "))
            if (dzialy.size > 4) append("…")
        }

        val otworz = PendingIntent.getActivity(
            applicationContext,
            0,
            Intent(applicationContext, MainActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )

        val powiadomienie = NotificationCompat.Builder(applicationContext, PrzegladApp.KANAL_WYDANIA)
            .setSmallIcon(R.drawable.ic_powiadomienie)
            .setContentTitle("${applicationContext.getString(R.string.powiadomienie_tytul)} z $dzien")
            .setContentText(czolowy.ifEmpty { "Świeże wydanie jest gotowe." })
            .setStyle(NotificationCompat.BigTextStyle().bigText(tresc))
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setContentIntent(otworz)
            .setAutoCancel(true)
            .build()

        try {
            menedzer.notify(numer.hashCode(), powiadomienie)
        } catch (blad: SecurityException) {
            Log.w(TAG, "brak zgody na powiadomienia")
        }
    }

    private companion object {
        const val TAG = "PrzegladWorker"
    }
}
