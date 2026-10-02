package com.edufee.schoolmanager;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

@CapacitorPlugin(name = "GallerySaver")
public class GallerySaverPlugin extends Plugin {

    @PluginMethod
    public void saveImageToGallery(PluginCall call) {
        String base64Data = call.getString("base64");
        String fileName = call.getString("fileName");
        if (fileName == null || fileName.trim().isEmpty()) {
            fileName = "Receipt-" + System.currentTimeMillis() + ".png";
        }
        if (!fileName.endsWith(".png") && !fileName.endsWith(".jpg")) {
            fileName += ".png";
        }

        if (base64Data == null || base64Data.isEmpty()) {
            call.reject("Image base64 data is required");
            return;
        }

        try {
            if (base64Data.contains(",")) {
                base64Data = base64Data.substring(base64Data.indexOf(",") + 1);
            }

            byte[] decodedBytes = Base64.decode(base64Data, Base64.DEFAULT);
            Bitmap bitmap = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.length);

            if (bitmap == null) {
                call.reject("Failed to decode image");
                return;
            }

            Uri imageUri = null;
            ContentResolver resolver = getContext().getContentResolver();

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentValues contentValues = new ContentValues();
                contentValues.put(MediaStore.MediaColumns.DISPLAY_NAME, fileName);
                contentValues.put(MediaStore.MediaColumns.MIME_TYPE, "image/png");
                contentValues.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + File.separator + "EduFee");
                contentValues.put(MediaStore.MediaColumns.IS_PENDING, 1);

                imageUri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, contentValues);
                if (imageUri != null) {
                    try (OutputStream fos = resolver.openOutputStream(imageUri)) {
                        bitmap.compress(Bitmap.CompressFormat.PNG, 100, fos);
                    }
                    contentValues.clear();
                    contentValues.put(MediaStore.MediaColumns.IS_PENDING, 0);
                    resolver.update(imageUri, contentValues, null, null);
                }
            } else {
                File picturesDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES);
                File appDir = new File(picturesDir, "EduFee");
                if (!appDir.exists()) {
                    appDir.mkdirs();
                }
                File imageFile = new File(appDir, fileName);
                try (FileOutputStream fos = new FileOutputStream(imageFile)) {
                    bitmap.compress(Bitmap.CompressFormat.PNG, 100, fos);
                }
                imageUri = Uri.fromFile(imageFile);

                Intent mediaScanIntent = new Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE);
                mediaScanIntent.setData(imageUri);
                getContext().sendBroadcast(mediaScanIntent);
            }

            if (imageUri != null) {
                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("uri", imageUri.toString());
                ret.put("message", "Receipt saved to Gallery (Pictures/EduFee)");
                call.resolve(ret);
            } else {
                call.reject("Could not create MediaStore entry");
            }
        } catch (Exception e) {
            call.reject("Error saving to gallery: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void shareImage(PluginCall call) {
        String base64Data = call.getString("base64");
        String fileName = call.getString("fileName");
        String title = call.getString("title", "Fee Receipt Voucher");

        if (fileName == null || fileName.trim().isEmpty()) {
            fileName = "Receipt-" + System.currentTimeMillis() + ".png";
        }
        if (!fileName.endsWith(".png")) {
            fileName += ".png";
        }

        if (base64Data == null || base64Data.isEmpty()) {
            call.reject("Image base64 data is required");
            return;
        }

        try {
            if (base64Data.contains(",")) {
                base64Data = base64Data.substring(base64Data.indexOf(",") + 1);
            }

            byte[] decodedBytes = Base64.decode(base64Data, Base64.DEFAULT);
            Bitmap bitmap = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.length);

            if (bitmap == null) {
                call.reject("Failed to decode image");
                return;
            }

            File cacheDir = getContext().getCacheDir();
            File imagesDir = new File(cacheDir, "shared_images");
            if (!imagesDir.exists()) {
                imagesDir.mkdirs();
            }
            File imageFile = new File(imagesDir, fileName);
            try (FileOutputStream fos = new FileOutputStream(imageFile)) {
                bitmap.compress(Bitmap.CompressFormat.PNG, 100, fos);
            }

            Uri contentUri = FileProvider.getUriForFile(
                getContext(),
                getContext().getPackageName() + ".fileprovider",
                imageFile
            );

            Intent shareIntent = new Intent(Intent.ACTION_SEND);
            shareIntent.setType("image/png");
            shareIntent.putExtra(Intent.EXTRA_STREAM, contentUri);
            shareIntent.putExtra(Intent.EXTRA_SUBJECT, title);
            shareIntent.putExtra(Intent.EXTRA_TEXT, title);
            shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

            Intent chooser = Intent.createChooser(shareIntent, title);
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(chooser);

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Error sharing image: " + e.getMessage(), e);
        }
    }
}
