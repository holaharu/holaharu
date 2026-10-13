package com.haru.dadtv;
import android.app.*;
import android.os.*;
import android.content.*;
import android.graphics.Color;
import android.view.*;
import android.webkit.*;
import android.widget.*;
import android.provider.Settings;
import android.net.Uri;
public class MainActivity extends Activity {
 private WebView browser; private FrameLayout root,videoLayer; private View fullView;
 private WebChromeClient.CustomViewCallback fullCallback; private String home;
 private static final String DEFAULT_URL="https://tvwiki.store/";
 private static final int BLUE=Color.rgb(22,73,146);
 @Override public void onCreate(Bundle state){super.onCreate(state);
 getWindow().setStatusBarColor(BLUE);getWindow().setNavigationBarColor(Color.BLACK);
 home=getPreferences(0).getString("home",DEFAULT_URL);
 root=new FrameLayout(this);setContentView(root);
 LinearLayout layout=new LinearLayout(this);layout.setOrientation(LinearLayout.VERTICAL);root.addView(layout);
 LinearLayout toolbar=new LinearLayout(this);toolbar.setPadding(6,5,6,5);toolbar.setBackgroundColor(BLUE);layout.addView(toolbar);
 addButton(toolbar,"홈",()->browser.loadUrl(home));
 addButton(toolbar,"뒤로",()->{if(browser.canGoBack())browser.goBack();});
 addButton(toolbar,"TV 연결",this::openCast);
 addButton(toolbar,"주소 변경",this::editAddress);
 browser=new WebView(this);layout.addView(browser,new LinearLayout.LayoutParams(-1,0,1));
 WebSettings s=browser.getSettings();s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);s.setMediaPlaybackRequiresUserGesture(true);s.setSupportMultipleWindows(false);
 browser.setWebViewClient(new WebViewClient(){@Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){return !r.getUrl().getScheme().startsWith("http");}});
 browser.setWebChromeClient(new WebChromeClient(){
 @Override public void onShowCustomView(View view,CustomViewCallback callback){if(fullView!=null){callback.onCustomViewHidden();return;}fullView=view;fullCallback=callback;videoLayer=new FrameLayout(MainActivity.this);videoLayer.setBackgroundColor(Color.BLACK);videoLayer.addView(view,new FrameLayout.LayoutParams(-1,-1));root.addView(videoLayer,new FrameLayout.LayoutParams(-1,-1));getWindow().getDecorView().setSystemUiVisibility(5894|1024|512);}
 @Override public void onHideCustomView(){closeFull();}
 });browser.loadUrl(home);
 }
 private void addButton(LinearLayout bar,String title,Runnable action){Button b=new Button(this);b.setText(title);b.setTextSize(12);b.setTextColor(Color.WHITE);b.setAllCaps(false);b.setPadding(2,0,2,0);b.setBackgroundTintList(android.content.res.ColorStateList.valueOf(BLUE));bar.addView(b,new LinearLayout.LayoutParams(0,52,1));b.setOnClickListener(v->action.run());}
 private void openCast(){new AlertDialog.Builder(this).setTitle("TV 연결").setMessage("휴대폰과 TV를 같은 Wi-Fi에 연결하세요. 연결 설정에서 TV를 선택하거나 빠른 설정창의 Smart View를 누르세요.").setPositiveButton("연결 설정 열기",(d,w)->{try{startActivity(new Intent("android.settings.CAST_SETTINGS"));}catch(Exception e){try{startActivity(new Intent(Settings.ACTION_SETTINGS));}catch(Exception ignored){Toast.makeText(this,"빠른 설정창에서 Smart View를 선택하세요",Toast.LENGTH_LONG).show();}}}).setNegativeButton("취소",null).show();}
 private void editAddress(){EditText text=new EditText(this);text.setSingleLine();text.setText(home);text.setSelectAllOnFocus(true);new AlertDialog.Builder(this).setTitle("사이트 주소 변경").setView(text).setPositiveButton("저장 후 열기",(d,w)->{String u=text.getText().toString().trim();Uri parsed=Uri.parse(u);if(!"https".equalsIgnoreCase(parsed.getScheme())||parsed.getHost()==null){Toast.makeText(this,"https:// 주소만 입력하세요",Toast.LENGTH_LONG).show();return;}home=u;getPreferences(0).edit().putString("home",home).apply();browser.loadUrl(home);}).setNegativeButton("취소",null).show();}
 private void closeFull(){if(fullView==null)return;root.removeView(videoLayer);videoLayer=null;fullView=null;getWindow().getDecorView().setSystemUiVisibility(0);if(fullCallback!=null){fullCallback.onCustomViewHidden();fullCallback=null;}}
 @Override public void onBackPressed(){if(fullView!=null)closeFull();else if(browser.canGoBack())browser.goBack();else super.onBackPressed();}
 @Override protected void onDestroy(){browser.destroy();super.onDestroy();}
}
