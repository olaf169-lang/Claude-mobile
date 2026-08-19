package pl.przegladnews.app

import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout

/**
 * Cała aplikacja to jeden ekran: opublikowany Przegląd News w WebView.
 *
 * Dzięki temu treść i wygląd aktualizują się bez wypuszczania nowego APK,
 * a service worker strony zapewnia działanie offline. Aplikacja dokłada to,
 * czego strona sama nie potrafi na Androidzie: powiadomienia w tle,
 * odświeżanie gestem i obsługę przycisku wstecz.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var widok: WebView
    private lateinit var odswiez: SwipeRefreshLayout

    private val pytanieOPowiadomienia =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { zgoda ->
            if (!zgoda) {
                Toast.makeText(this, R.string.kanal_wydania_opis, Toast.LENGTH_SHORT).show()
            }
        }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        widok = findViewById(R.id.widok)
        odswiez = findViewById(R.id.odswiez)

        widok.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            cacheMode = android.webkit.WebSettings.LOAD_DEFAULT
            mediaPlaybackRequiresUserGesture = true
            userAgentString = "$userAgentString PrzegladNewsAndroid/${BuildConfig.VERSION_NAME}"
        }
        widok.setBackgroundColor(ContextCompat.getColor(this, R.color.tlo))

        widok.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: WebResourceRequest,
            ): Boolean {
                val adres = request.url
                // W aplikacji zostaje tylko sam przegląd; źródła otwieramy w przeglądarce.
                if (adres.toString().startsWith(BuildConfig.PRZEGLAD_URL)) return false
                startActivity(Intent(Intent.ACTION_VIEW, adres))
                return true
            }

            override fun onPageFinished(view: WebView, url: String) {
                odswiez.isRefreshing = false
            }
        }

        odswiez.setOnRefreshListener { widok.reload() }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (widok.canGoBack()) widok.goBack() else finish()
            }
        })

        if (savedInstanceState == null) {
            widok.loadUrl(BuildConfig.PRZEGLAD_URL)
        } else {
            widok.restoreState(savedInstanceState)
        }

        poprosOPowiadomienia()
    }

    private fun poprosOPowiadomienia() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return
        val zgoda = ContextCompat.checkSelfPermission(
            this, android.Manifest.permission.POST_NOTIFICATIONS,
        )
        if (zgoda != PackageManager.PERMISSION_GRANTED) {
            pytanieOPowiadomienia.launch(android.Manifest.permission.POST_NOTIFICATIONS)
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        widok.saveState(outState)
    }

    override fun onResume() {
        super.onResume()
        // Po otwarciu przeglądu powiadomienie o nim nie ma już czego przypominać.
        NotificationManagerCompat.from(this).cancelAll()
    }
}
