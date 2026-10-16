package online.codyuhi.qualityoflife

import android.app.Application
import online.codyuhi.qualityoflife.di.AppContainer
import online.codyuhi.qualityoflife.di.DefaultAppContainer

class QualityOfLifeApplication : Application() {
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = DefaultAppContainer(this)
    }
}
