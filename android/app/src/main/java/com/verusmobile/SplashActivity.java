package com.verusmobile;
import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
//import androidx.appcompat.app.AppCompatActivity;

public class SplashActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Intent intent = new Intent(this, MainActivity.class);
        startActivity(intent);
        finish();
    }
}
