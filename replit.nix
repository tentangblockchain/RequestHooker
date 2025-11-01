
{ pkgs }: {
  deps = [
    pkgs.nodejs-20
    pkgs.chromium
    pkgs.nss
    pkgs.freetype
    pkgs.harfbuzz
    pkgs.ttf_bitstream_vera
    pkgs.fontconfig
    pkgs.libGL
    pkgs.glib
    pkgs.atk
    pkgs.gtk3
    pkgs.pango
    pkgs.cairo
    pkgs.gdk-pixbuf
    pkgs.libdrm
    pkgs.xorg.libX11
    pkgs.xorg.libxcb
    pkgs.xorg.libXcomposite
    pkgs.xorg.libXdamage
    pkgs.xorg.libXext
    pkgs.xorg.libXfixes
    pkgs.xorg.libXrandr
    pkgs.mesa
    pkgs.expat
    pkgs.alsa-lib
    pkgs.at-spi2-atk
    pkgs.at-spi2-core
    pkgs.cups
    pkgs.dbus
    pkgs.nspr
  ];
}
