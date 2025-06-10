package com.fantasy.nuts

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.runtime.Composable
import com.fantasy.nuts.navigation.AppNavHost
import androidx.compose.ui.Modifier
import androidx.navigation.compose.rememberNavController
import com.fantasy.nuts.ui.theme.NutsTheme
import dagger.hilt.android.AndroidEntryPoint


@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            NutsTheme {
                NutsApp(modifier = Modifier.fillMaxSize())
            }
        }
    }
}

@Composable
fun NutsApp(modifier: Modifier = Modifier) {
    val navController = rememberNavController()
    AppNavHost(
        navController = navController,
        modifier = modifier
    )
}

@Preview(showBackground = true)
@Composable
fun NutsAppPreview() {
    NutsTheme {
        NutsApp()
    }
}
