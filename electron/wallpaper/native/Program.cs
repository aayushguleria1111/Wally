using System;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

namespace Wally.Native
{
    class Program
    {
        private const uint WM_SPAWN_WORKER = 0x052C;
        private const int SMTO_NORMAL = 0x0000;
        private const uint SWP_NOZORDER = 0x0004;
        private const uint SWP_NOACTIVATE = 0x0010;
        private const uint SWP_SHOWWINDOW = 0x0040;
        private const int GWL_STYLE = -16;
        private const long WS_CHILD = 0x40000000L;
        private const long WS_POPUP = 0x80000000L;
        private const long WS_VISIBLE = 0x10000000L;
        private const long WS_CLIPSIBLINGS = 0x04000000L;

        private const int SPI_SETDESKWALLPAPER = 20;
        private const int SPI_GETDESKWALLPAPER = 0x0073;
        private const int SPIF_UPDATEINIFILE = 0x01;
        private const int SPIF_SENDCHANGE = 0x02;

        [StructLayout(LayoutKind.Sequential)]
        public struct RECT
        {
            public int Left;
            public int Top;
            public int Right;
            public int Bottom;
        }

        [DllImport("user32.dll", SetLastError = true)]
        private static extern IntPtr FindWindow(string lpClassName, string lpWindowName);

        [DllImport("user32.dll", SetLastError = true)]
        private static extern IntPtr FindWindowEx(IntPtr parentHandle, IntPtr childAfter, string className, string windowTitle);

        [DllImport("user32.dll", CharSet = CharSet.Auto)]
        private static extern IntPtr SendMessageTimeout(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam, uint fuFlags, uint uTimeout, out IntPtr lpdwResult);

        private delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

        [DllImport("user32.dll", SetLastError = true)]
        private static extern IntPtr SetParent(IntPtr hWndChild, IntPtr hWndNewParent);

        [DllImport("user32.dll", SetLastError = true)]
        private static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);

        [DllImport("user32.dll", EntryPoint = "GetWindowLongPtr")]
        private static extern IntPtr GetWindowLongPtr64(IntPtr hWnd, int nIndex);

        [DllImport("user32.dll", EntryPoint = "GetWindowLong")]
        private static extern IntPtr GetWindowLongPtr32(IntPtr hWnd, int nIndex);

        private static IntPtr GetWindowLongPtr(IntPtr hWnd, int nIndex)
        {
            if (IntPtr.Size == 8)
                return GetWindowLongPtr64(hWnd, nIndex);
            return GetWindowLongPtr32(hWnd, nIndex);
        }

        [DllImport("user32.dll", EntryPoint = "SetWindowLongPtr")]
        private static extern IntPtr SetWindowLongPtr64(IntPtr hWnd, int nIndex, IntPtr dwNewLong);

        [DllImport("user32.dll", EntryPoint = "SetWindowLong")]
        private static extern IntPtr SetWindowLongPtr32(IntPtr hWnd, int nIndex, IntPtr dwNewLong);

        private static IntPtr SetWindowLongPtr(IntPtr hWnd, int nIndex, IntPtr dwNewLong)
        {
            if (IntPtr.Size == 8)
                return SetWindowLongPtr64(hWnd, nIndex, dwNewLong);
            return SetWindowLongPtr32(hWnd, nIndex, dwNewLong);
        }

        [DllImport("user32.dll")]
        private static extern int GetSystemMetrics(int nIndex);

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern int SystemParametersInfo(int uAction, int uParam, string lpvParam, int fuWinIni);

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern int SystemParametersInfo(int uAction, int uParam, StringBuilder lpvParam, int fuWinIni);

        [DllImport("user32.dll")]
        private static extern IntPtr GetForegroundWindow();

        [DllImport("user32.dll")]
        private static extern IntPtr GetShellWindow();

        [DllImport("user32.dll")]
        private static extern IntPtr GetDesktopWindow();

        [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
        private static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

        [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
        private static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

        [DllImport("user32.dll")]
        private static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool IsIconic(IntPtr hWnd);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool IsZoomed(IntPtr hWnd);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

        static int Main(string[] args)
        {
            // Ensure Console stdout is unbuffered
            Console.SetOut(new StreamWriter(Console.OpenStandardOutput()) { AutoFlush = true });

            if (args.Length == 0)
            {
                Console.WriteLine("Usage: WallyAttacher attach <HWND> [x y w h] | detach <HWND> | findworkerw | setwallpaper <path> | checkfocus [wallyPid] [wallpaperHwnd] | loopfocus [wallyPid] [wallpaperHwnd] [intervalMs]");
                return 1;
            }

            string action = args[0].ToLowerInvariant();

            try
            {
                if (action == "findworkerw")
                {
                    IntPtr workerW = GetWorkerW();
                    Console.WriteLine(workerW.ToInt64());
                    return workerW != IntPtr.Zero ? 0 : 2;
                }
                else if (action == "attach")
                {
                    if (args.Length < 2)
                    {
                        Console.Error.WriteLine("Missing HWND argument.");
                        return 1;
                    }

                    long rawHwnd = Convert.ToInt64(args[1]);
                    IntPtr targetHwnd = new IntPtr(rawHwnd);

                    int x = 0;
                    int y = 0;
                    int w = GetSystemMetrics(0); // SM_CXSCREEN
                    int h = GetSystemMetrics(1); // SM_CYSCREEN

                    if (args.Length >= 6)
                    {
                        x = int.Parse(args[2]);
                        y = int.Parse(args[3]);
                        w = int.Parse(args[4]);
                        h = int.Parse(args[5]);
                    }

                    IntPtr workerW = GetWorkerW();
                    if (workerW == IntPtr.Zero)
                    {
                        Console.Error.WriteLine("Could not locate or spawn WorkerW desktop window.");
                        return 3;
                    }

                    SetParent(targetHwnd, workerW);

                    long style = GetWindowLongPtr(targetHwnd, GWL_STYLE).ToInt64();
                    style &= ~WS_POPUP;
                    style |= (WS_CHILD | WS_VISIBLE | WS_CLIPSIBLINGS);
                    SetWindowLongPtr(targetHwnd, GWL_STYLE, new IntPtr(style));

                    SetWindowPos(targetHwnd, IntPtr.Zero, x, y, w, h, SWP_NOZORDER | SWP_NOACTIVATE | SWP_SHOWWINDOW);

                    Console.WriteLine(string.Format("SUCCESS: Attached HWND {0} to WorkerW {1} at {2},{3} {4}x{5}", targetHwnd, workerW, x, y, w, h));
                    return 0;
                }
                else if (action == "detach")
                {
                    if (args.Length < 2)
                    {
                        Console.Error.WriteLine("Missing HWND argument.");
                        return 1;
                    }

                    long rawHwnd = Convert.ToInt64(args[1]);
                    IntPtr targetHwnd = new IntPtr(rawHwnd);

                    SetParent(targetHwnd, IntPtr.Zero);
                    Console.WriteLine(string.Format("SUCCESS: Detached HWND {0}", targetHwnd));
                    return 0;
                }
                else if (action == "setwallpaper")
                {
                    if (args.Length < 2)
                    {
                        Console.Error.WriteLine("Missing image path argument.");
                        return 1;
                    }

                    string imagePath = args[1];
                    int result = SystemParametersInfo(SPI_SETDESKWALLPAPER, 0, imagePath, SPIF_UPDATEINIFILE | SPIF_SENDCHANGE);
                    if (result != 0)
                    {
                        Console.WriteLine(string.Format("SUCCESS: Desktop wallpaper set to {0}", imagePath));
                        return 0;
                    }
                    else
                    {
                        Console.Error.WriteLine(string.Format("FAILED: SystemParametersInfo returned {0}", Marshal.GetLastWin32Error()));
                        return 4;
                    }
                }
                else if (action == "getwallpaper")
                {
                    string wallpaper = GetCurrentWindowsWallpaper();
                    Console.WriteLine(wallpaper ?? string.Empty);
                    return 0;
                }
                else if (action == "checkfocus")
                {
                    uint wallyPid = 0;
                    IntPtr wallpaperHwnd = IntPtr.Zero;

                    if (args.Length >= 2) uint.TryParse(args[1], out wallyPid);
                    if (args.Length >= 3)
                    {
                        long h;
                        if (long.TryParse(args[2], out h)) wallpaperHwnd = new IntPtr(h);
                    }

                    bool isDesktop = IsDesktopVisibleOrFocused(wallyPid, wallpaperHwnd);
                    Console.WriteLine(isDesktop ? "DESKTOP_FOCUSED" : "DESKTOP_UNFOCUSED");
                    return isDesktop ? 0 : 1;
                }
                else if (action == "loopfocus" || action == "watchfocus")
                {
                    uint wallyPid = 0;
                    IntPtr wallpaperHwnd = IntPtr.Zero;
                    int intervalMs = 250;

                    if (args.Length >= 2) uint.TryParse(args[1], out wallyPid);
                    if (args.Length >= 3)
                    {
                        long h;
                        if (long.TryParse(args[2], out h)) wallpaperHwnd = new IntPtr(h);
                    }
                    if (args.Length >= 4) int.TryParse(args[3], out intervalMs);

                    RunFocusLoop(wallyPid, wallpaperHwnd, intervalMs);
                    return 0;
                }
                else
                {
                    Console.Error.WriteLine(string.Format("Unknown action: {0}", action));
                    return 1;
                }
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine(string.Format("Error: {0}", ex.Message));
                return 99;
            }
        }

        private static void RunFocusLoop(uint wallyPid, IntPtr wallpaperHwnd, int intervalMs)
        {
            if (intervalMs < 100) intervalMs = 100;
            bool? lastState = null;

            while (true)
            {
                try
                {
                    bool currentState = IsDesktopVisibleOrFocused(wallyPid, wallpaperHwnd);
                    if (!lastState.HasValue || currentState != lastState.Value)
                    {
                        lastState = currentState;
                        Console.WriteLine(currentState ? "DESKTOP_FOCUSED" : "DESKTOP_UNFOCUSED");
                        Console.Out.Flush();
                    }
                }
                catch
                {
                }

                Thread.Sleep(intervalMs);
            }
        }

        private static bool IsDesktopVisibleOrFocused(uint wallyPid, IntPtr wallpaperHwnd)
        {
            IntPtr fg = GetForegroundWindow();

            // 1. If foreground is null (0), windows are minimized or desktop is showing
            if (fg == IntPtr.Zero)
            {
                return true;
            }

            // 2. If the user is currently focused on Wally's application window
            if (wallyPid > 0)
            {
                uint fgPid = 0;
                GetWindowThreadProcessId(fg, out fgPid);
                if (fgPid == wallyPid)
                {
                    return true;
                }
            }

            // 3. If the foreground window is our wallpaper window or shell desktop
            if (wallpaperHwnd != IntPtr.Zero && fg == wallpaperHwnd)
            {
                return true;
            }

            IntPtr shell = GetShellWindow();
            if (shell != IntPtr.Zero && fg == shell)
            {
                return true;
            }

            IntPtr desktop = GetDesktopWindow();
            if (desktop != IntPtr.Zero && fg == desktop)
            {
                return true;
            }

            // 4. If the active window is minimized (e.g. after Win+D / Win+M)
            if (IsIconic(fg))
            {
                return true;
            }

            // 5. Inspect class name and window title
            StringBuilder sbCls = new StringBuilder(256);
            GetClassName(fg, sbCls, 256);
            string cls = sbCls.ToString();

            // Check known desktop, taskbar, start menu, and shell window classes
            if (cls == "Progman" ||
                cls == "WorkerW" ||
                cls == "SHELLDLL_DefView" ||
                cls == "SysListView32" ||
                cls == "Shell_TrayWnd" ||
                cls == "Shell_SecondaryTrayWnd" ||
                cls == "Windows.UI.Core.CoreWindow" ||
                cls == "XamlExplorerHostIslandWindow" ||
                cls == "TopLevelWindowForOverflowXamlIsland" ||
                cls == "DV2ControlHost" ||
                cls == "Button" ||
                cls == "ApplicationFrameWindow")
            {
                // Note: ApplicationFrameWindow can be Windows Settings or Start/Widgets
                if (cls != "ApplicationFrameWindow")
                {
                    return true;
                }
                else
                {
                    StringBuilder sbTitle = new StringBuilder(256);
                    GetWindowText(fg, sbTitle, 256);
                    string title = sbTitle.ToString();
                    if (title == "Start" || title == "Windows Shell Experience Host" || title == "")
                    {
                        return true;
                    }
                }
            }

            // 6. Check window area coverage:
            // If the active window does NOT cover most of the screen (e.g. small tool, sticky note, calculator),
            // the desktop remains substantially visible!
            int screenW = GetSystemMetrics(0);
            int screenH = GetSystemMetrics(1);
            long totalScreenArea = (long)screenW * screenH;

            RECT rect;
            if (GetWindowRect(fg, out rect))
            {
                long winW = Math.Max(0, rect.Right - rect.Left);
                long winH = Math.Max(0, rect.Bottom - rect.Top);
                long winArea = winW * winH;

                // If foreground window covers less than 65% of screen area, desktop is visible!
                if (totalScreenArea > 0 && winArea < (totalScreenArea * 0.65))
                {
                    return true;
                }
            }

            // Otherwise, an application window is covering the desktop and has active focus
            return false;
        }

        private static IntPtr GetWorkerW()
        {
            IntPtr progman = FindWindow("Progman", null);
            if (progman == IntPtr.Zero)
            {
                return IntPtr.Zero;
            }

            IntPtr result = IntPtr.Zero;
            SendMessageTimeout(progman, WM_SPAWN_WORKER, new IntPtr(0x0000000D), IntPtr.Zero, SMTO_NORMAL, 1000, out result);
            SendMessageTimeout(progman, WM_SPAWN_WORKER, IntPtr.Zero, IntPtr.Zero, SMTO_NORMAL, 1000, out result);

            IntPtr workerW = IntPtr.Zero;

            EnumWindows(new EnumWindowsProc(delegate(IntPtr tophwnd, IntPtr topparam)
            {
                IntPtr shellView = FindWindowEx(tophwnd, IntPtr.Zero, "SHELLDLL_DefView", null);
                if (shellView != IntPtr.Zero)
                {
                    workerW = FindWindowEx(IntPtr.Zero, tophwnd, "WorkerW", null);
                }
                return true;
            }), IntPtr.Zero);

            if (workerW == IntPtr.Zero)
            {
                workerW = progman;
            }

            return workerW;
        }

        private static string GetCurrentWindowsWallpaper()
        {
            try
            {
                StringBuilder sb = new StringBuilder(1024);
                if (SystemParametersInfo(SPI_GETDESKWALLPAPER, sb.Capacity, sb, 0) != 0)
                {
                    string p = sb.ToString();
                    if (!string.IsNullOrEmpty(p) && File.Exists(p) && !p.ToLowerInvariant().Contains("wally"))
                        return p;
                }
            }
            catch {}

            try
            {
                using (var key = Microsoft.Win32.Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Explorer\Wallpapers"))
                {
                    if (key != null)
                    {
                        object val = key.GetValue("BackedUpWallpaperPath");
                        if (val != null)
                        {
                            string p = val.ToString();
                            if (!string.IsNullOrEmpty(p) && File.Exists(p) && !p.ToLowerInvariant().Contains("wally"))
                                return p;
                        }
                    }
                }
            }
            catch {}

            try
            {
                using (var key = Microsoft.Win32.Registry.CurrentUser.OpenSubKey(@"Control Panel\Desktop"))
                {
                    if (key != null)
                    {
                        object val = key.GetValue("Wallpaper");
                        if (val != null)
                        {
                            string p = val.ToString();
                            if (!string.IsNullOrEmpty(p) && File.Exists(p) && !p.ToLowerInvariant().Contains("wally"))
                                return p;
                        }
                    }
                }
            }
            catch {}

            string transcoded = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), @"Microsoft\Windows\Themes\TranscodedWallpaper");
            if (File.Exists(transcoded)) return transcoded;

            string winDefault = @"C:\Windows\Web\Wallpaper\Windows\img0.jpg";
            if (File.Exists(winDefault)) return winDefault;

            return string.Empty;
        }
    }
}
