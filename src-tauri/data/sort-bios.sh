#!/usr/bin/env bash
# sort-bios.sh — copy BIOS files (a RetroArch "system" folder, or a folder of zip/7z/rar packs) into
# Emu Vault's bios/<system>/ folders.
#
#   bash sort-bios.sh <folder> <vault folder> [--dry] [--fix]
#   bash sort-bios.sh "/media/you/drive/bios/system" ~/Desktop/emu@vault --dry
#
# Run it again with another folder: only what the vault doesn't have yet is added.
# It only COPIES: nothing in the source changes, and nothing in the vault is overwritten
# (except with --fix: a WRONG dump in the vault is swapped for the right one; the old one goes to bios/_replaced/).
#
#   known BIOS names          -> bios/<system>/          (scph5501.bin -> bios/psx/)
#   other names, known md5    -> bios/<system>/<right name>  ('Sega Saturn BIOS v1.00 (E+U).bin' -> saturn/mpr-17933.bin)
#   a 4 MB .bin               -> bios/ps2/ (every PS2 console has its own name)
#   pcsx2/bios/*  dc/*  neocd/*  PPSSPP/  dolphin-emu/  -> ps2, dreamcast, neogeocd, psp, gc+wii
#   sys_modules/* and *.sprx   -> bios/ps4/sys_modules/, fonts/font(2)/* -> bios/ps4/fonts/   (PS3UPDAT.PUP -> bios/ps3/ by name)
#   core folders (vice/, mame/…) -> bios/_retroarch/ whole; a known BIOS in them also to bios/<system>/
#   zip / 7z / rar packs      -> unpacked in a temporary folder and sorted the same way (packs in packs too)
#   everything else           -> bios/_retroarch/  (Emu Vault 0.9.1 puts it in RetroArch-BIOS as it is)
set -u
SRC0="${1:-}"; VAULT="${2:-}"; DRY=0; FIX=0
for o in "${@:3}"; do [ "$o" = "--dry" ] && DRY=1; [ "$o" = "--fix" ] && FIX=1; done
if [ -z "$SRC0" ] || [ -z "$VAULT" ] || [ ! -d "$SRC0" ] || [ ! -d "$VAULT" ]; then
  echo "Use: bash $0 <folder> <vault folder> [--dry] [--fix]"; exit 1
fi
SRC0="${SRC0%/}"; B="${VAULT%/}/bios"
declare -A SYS MD5 GOOD PLAN
while IFS='|' read -r n s; do [ -n "$n" ] && SYS["$n"]="$s"; done <<'TABLE'
000-lo.lo|neogeocd
2608_bd.wav|pc98
2608_hh.wav|pc98
2608_rim.wav|pc98
2608_sd.wav|pc98
2608_tom.wav|pc98
2608_top.wav|pc98
3do_arcade_saot.bin|3do
5200.rom|atari5200
64dd_ipl.bin|n64dd
7800 bios (e).rom|atari7800
7800 bios (u).rom|atari7800
aes.zip|neogeo
aes_keys.txt|3ds n3ds
areplay.bin|megadrive
ataribas.rom|atari800
atariosa.rom|atari800
atariosb.rom|atari800
atarixl.rom|atari800
awbios.zip|dreamcast
bb01r4_os.rom|atari800
bios.col|colecovision
bios.gg|gamegear
bios.min|pokemini
bios.rom|pc98
bios.sms|mastersystem
bios7.bin|nds
bios9.bin|nds
bios_cd_e.bin|segacd
bios_cd_j.bin|segacd
bios_cd_u.bin|segacd
bios_e.sms|mastersystem
bios_j.sms|mastersystem
bios_md.bin|megadrive
bios_u.sms|mastersystem
bs-x.bin|satellaview
bubsys.zip|arcade
c52.bin|odyssey2
cchip.zip|arcade
cdibios.zip|cdimono1
cdimono1.zip|cdimono1
cdimono2.zip|cdimono1
cgb_boot.bin|gbc
cgrom.dat|x68000
colecovision.rom|colecovision
complex_4627.bin|xbox
cx4.data.rom|snes
dc_boot.bin|dreamcast
dc_flash.bin|dreamcast
decocass.zip|arcade
disk.rom|msx msx2
disksys.rom|fds
dmg_boot.bin|gb
dsi_bios7.bin|dsi
dsi_bios9.bin|dsi
dsi_firmware.bin|dsi
dsi_nand.bin|dsi
dsp1.data.rom|snes
dsp1.program.rom|snes
dsp1b.data.rom|snes
dsp1b.program.rom|snes
dsp2.data.rom|snes
dsp2.program.rom|snes
dsp3.data.rom|snes
dsp3.program.rom|snes
dsp4.data.rom|snes
dsp4.program.rom|snes
exec.bin|intellivision
firmware.bin|nds
fmpac.rom|msx msx2
font.bmp|pc98
font.rom|pc98
front-sp1.bin|neogeocd
g7400.bin|videopac
gamegenie.nes|fds
gb_bios.bin|gb
gba_bios.bin|gba
gbc_bios.bin|gbc
gexpress.pce|pcenginecd
ggenie.bin|megadrive
goldstar.bin|3do
grom.bin|intellivision
hiscore.dat|neogeo arcade
ipl.bin|gc
iplrom.dat|x68000
iplrom.x1|x1
iplrom30.dat|x68000
iplromco.dat|x68000
iplromxv.dat|x68000
isgsm.zip|arcade
itf.rom|pc98
jiffydos_1541-ii.bin|c64
jiffydos_c64.bin|c64
jopac.bin|odyssey2
kanji.rom|msx msx2
keys.txt|wiiu
kick34005.a500|amiga cdtv
kick34005.cdtv|cdtv
kick37175.a500|amiga
kick40060.cd32|amigacd32
kick40060.cd32.ext|amigacd32
kick40063.a600|amiga
kick40068.a1200|amiga
kick40068.a4000|amiga
lynxboot.img|atarilynx
macii.rom|_retroarch
mcpx_1.0.bin|xbox
midssio.zip|arcade
mpr-17933.bin|saturn
msx.rom|msx
msx2.rom|msx2
msx2ext.rom|msx2
msx2p.rom|msx2
msx2pext.rom|msx2
msxdos2.rom|msx
naomi.zip|dreamcast naomi
naomi2.zip|naomi2
neocd.bin|neogeocd
neogeo.zip|neogeo arcade
ng-lo.rom|neogeocd
nmk004.zip|arcade
o2rom.bin|odyssey2
otp.bin|wiiu
painter.rom|msx
panafz1.bin|3do
panafz10.bin|3do
panafz1j.bin|3do
pcfx.rom|pcfx
pgm.zip|arcade
prod.keys|switch
ps1_rom.bin|psx
ps2-0230a-20080220.bin|ps2
ps2-0230e-20080220.bin|ps2
ps2-0230j-20080220.bin|ps2
ps3updat.pup|ps3
psp2updat.pup|psvita
psvupdat.pup|psvita
psxonpsp660.bin|psx
sanyotry.bin|3do
saturn_bios.bin|saturn
scph1001.bin|psx
scph5500.bin|psx
scph5501.bin|psx
scph5502.bin|psx
scph7001.bin|psx
seeprom.bin|wiiu
sega_101.bin|saturn
sgb.boot.rom|gb
sgb1.sfc|gb
sgb2.sfc|gb
sgb2_boot.bin|gb
sgb_bios.bin|gb
sk.bin|megadrive
sk2chip.bin|megadrive
skns.zip|arcade
sl31253.bin|channelf
sl31254.bin|channelf
sl90025.bin|channelf
sound.rom|pc98
st010.data.rom|snes
st010.program.rom|snes
st011.data.rom|snes
st011.program.rom|snes
st018.data.rom|snes
st018.program.rom|snes
stbios.bin|sufami
stvbios.zip|saturn
syscard1.pce|pcenginecd
syscard2.pce|pcenginecd
syscard3.pce|pcengine pcenginecd
title.keys|switch
top-sp1.bin|neogeocd
tos.img|atarist
uni-bioscd.rom|neogeocd
upd7801g.s01|epoch-super-cassette-vision
xbox_hdd.qcow2|xbox
xegame.rom|atari800
ym2608.zip|arcade
TABLE
while IFS='|' read -r h s; do [ -n "$h" ] && MD5["$h"]="$s"; done <<'TABLE'
00dad01abdbf8ea9e79ad2fe11bdb182|arcade/neogeo.zip
0617321daa182c3f3d6f41fd02fb3275|x68000/iplromxv.dat
06daac977823773a3eea3422fd26a703|atari800/ATARIXL.ROM
0763f1ffb006ddbe32e52d497ee848ae|atari7800/7800 BIOS (U).rom
08c54a0c1f774a5538a848a6665a34b4|pc98/2608_HH.WAV
08ca8b2dba6662e8024f9e789711c6fc|neogeocd/uni-bioscd.rom
08e36edbea28a017f79f8d4f7ff9b6d7|pcfx/pcfx.rom
0bac0c6a50104045d902df4503a4c30b|atari800/ATARIBAS.ROM
0cd5946c6473e42e8e4c2137785e427f|intellivision/grom.bin
0e92c1e02862dfeb4cdef7f4414b14a9|saturn/stvbios.zip
122aee210324c72e8a11116e6ef9c0d0|neogeocd/top-sp1.bin
1b1e985ea5325a1f46eb7fd9681707bf|c64/JiffyDOS_1541-II.bin
1e4fb124a3a886865acb574f388c803d|pokemini/bios.min
1e68c231d0896b7eadcad1d7d8e76129|psx/scph7001.bin
21038400dc633070a78ad53090c53017|ps2/ps2-0230a-20080220.bin
2183c2aff17cf4297bdb496de78c2e8a|msx2/MSX2EXT.ROM
24a519c53f67b00640d0048ef7089105|mastersystem/bios_J.sms
278a9397d192149e84e820ac621a8edd|segacd/bios_CD_J.bin
279008e4a0db2dc5f1c048853b033828|odyssey2/jopac.bin
281f20ea4320404ec820fb7ec0693b38|atari5200/5200.rom
2b7ccb3d86baa18f6402c176f3065082|pcenginecd/syscard1.pce
2c66f5911e5b42b8ebe113403548eee7|colecovision/colecovision.rom
2efd74e3232ff260e371b99f84024f7f|segacd/bios_CD_U.bin
3240872c70984b6cbfda1586cab68dbe|saturn/mpr-17933.bin
32736f17079d0b2b7024407c39bd3050|psx/scph5502.bin
32fbbd84168d3482956eb3c5051637f5|gb/gb_bios.bin;gb/dmg_boot.bin
35fa1a1ebaaeea286dc5cd15487c13ea|3do/sanyotry.bin
37fc4e050b53a1ef2c2e7f3042553025|arcade/hiscore.dat
38179df8f4ac870017db21ebcbf53114|pcengine/syscard3.pce;pcenginecd/syscard3.pce
38d32748ae49d1815b0614970849fd40|pc98/FONT.ROM
397bb566584be7b9764e7a68974c4263|atari7800/7800 BIOS (E).rom
3cdd6614a918616bfc41c862e889dd79|pcenginecd/syscard2.pce
3f956c4e7008804cb47cbde49bd5b908|arcade/skns.zip
465ea0768b27da404aec45dfc501404b|pc98/2608_RIM.WAV
490f666e1afb15b7362b406ed1cea246|psx/scph5501.bin
ad7d1d44ed71fb093272c97a9ada20c3|ps4/fonts/font/c041056ts.ttf
7e506d6d01012a3d539773fc85cea2cc|ps4/fonts/font/d013013ds.ttf
716d6217fbad2c0c067efd0627ad7a20|ps4/fonts/font/DFHEI5-SONY.ttf
d8be19b9c5b724a8bdb51fc79be4d409|ps4/fonts/font2/DFHEI5-SONY2022.ttf
4e23131d06152ddadab15a20820815a1|ps4/fonts/font/e046323ms.ttf
9d59a66a0c3272e8fc6a3036cb06a4a8|ps4/fonts/font/e046323ts.ttf
b4c4ba4db62e93de79c953d3493088c7|ps4/fonts/font/k006004ds.ttf
be8cba042232554219905e01e72ebaa6|ps4/fonts/font/n023055ms.ttf
1078c40b04206b3d42a896994c723452|ps4/fonts/font/n023055ts.ttf
8e7736f4ed78c2c69741e3d7dace6c95|ps4/fonts/font2/PS4Icon.ttf
a802af61057daa982940c7090d99eaa7|ps4/fonts/font2/SCE-RDC-B-JPN.otf
a453464832ea429c83df9848ca11702d|ps4/fonts/font2/SCE-RDC-R-JPN.otf
80842b3fef049da0415d601c165af8a4|ps4/fonts/font/SCEPS4Yoongd-Bold.otf
436cd99c2557d8bbad5dc3487dc7e1bd|ps4/fonts/font/SCEPS4Yoongd-Light.otf
b04f895e987f17bc01a35bfe03cc94c0|ps4/fonts/font/SCEPS4Yoongd-Medium.otf
7b969bd10642acfac942850f501ec220|ps4/fonts/font2/SceWebKitSupplemental.otf
53eeb680cbc0908ee91456c80b29e263|ps4/fonts/font/SST-Bold.otf
34c6d18d1967bac038aa27c44b46a49d|ps4/fonts/font/SST-BoldItalic.otf
62f1498a31486f881be54c0d22ba7e79|ps4/fonts/font/SST-Italic.otf
a7e5584f15c55982ca8abb4eb84dcbd1|ps4/fonts/font/SST-Light.otf
8c453a6788c0f65d313672142c044352|ps4/fonts/font/SST-LightItalic.otf
f8f3fdecce546b8252b38213538e6f40|ps4/fonts/font/SST-Medium.otf
4a5f9670dcf02a8f59ccdc1412bc1cf2|ps4/fonts/font/SST-MediumItalic.otf
37d6ea9bc5956be1b853da826bc98a1f|ps4/fonts/font/SST-Roman.otf
e9824ccd348e3f4e8adc110704481554|ps4/fonts/font/SSTArabic-Bold.otf
9f3109f00fb2929df458fafec0780f8c|ps4/fonts/font2/SSTArabic-Bold.otf
a7d6072c44bb2c8ae45973fcec9f79e8|ps4/fonts/font/SSTArabic-Light.otf
29257b058921eb34f3c6038ee2f2f45a|ps4/fonts/font2/SSTArabic-Light.otf
18562b16c27b427a37df4cf8adac33fb|ps4/fonts/font/SSTArabic-Medium.otf
cb745f643e8636b35a87b9702d7ef448|ps4/fonts/font2/SSTArabic-Medium.otf
c7de6a09a5daedb7c8d8ed4d7fb4ec5c|ps4/fonts/font/SSTArabic-Roman.otf
c63fa645ecedd718fa1fa5b2b902ad47|ps4/fonts/font2/SSTArabic-Roman.otf
bcac6337ef69f027d3a6a25f2d6cf247|ps4/fonts/font/SSTAribStdB24-Regular.ttf
8c805fade9a07aa4a6b7d7d06c730f6f|ps4/fonts/font/SSTJpPro-Bold.otf
01e04a69a16a701ff9a1573d9598a8a5|ps4/fonts/font/SSTJpPro-Regular.otf
0db2887662268763e9cac29779ac4a93|ps4/fonts/font2/SSTThai-Bold.otf
cda13f157a7c915d3e18c219dd548fe6|ps4/fonts/font2/SSTThai-Light.otf
e66ec3dbbc03c1caa97925bb617ea10d|ps4/fonts/font2/SSTThai-Medium.otf
9bf6b05cb57e80f449d46a09318bf7d4|ps4/fonts/font2/SSTThai-Roman.otf
84b4b1420f634fa49af069c93389e7f2|ps4/fonts/font/SSTTypewriter-Bd.otf
3604dbe2c904370ff23145974b6fc129|ps4/fonts/font/SSTTypewriter-Roman.otf
73ddd689c2a6cc1e7160551a0613eea4|ps4/fonts/font2/SSTVietnamese-Bold.otf
acb128d760f9a64c19127c7d2e59b7c4|ps4/fonts/font2/SSTVietnamese-Light.otf
58f0b7b823ca6582bb30cbad898175fc|ps4/fonts/font2/SSTVietnamese-Medium.otf
60fb99491104ddb702beabb7061ffe3d|ps4/fonts/font2/SSTVietnamese-Roman.otf
8013477b612e63d96fcee2244c9fc2c6|ps4/sys_modules/libSceAudiodec.sprx
3a880f0c9dd5d330cf6a38641e34c29e|ps4/sys_modules/libSceCesCs.sprx
a1d601cdfba502e0f29e32bfc43b8c36|ps4/sys_modules/libSceFont.sprx
d5dd56462c76d91bac9ca0d8adc0319b|ps4/sys_modules/libSceFontFt.sprx
6e05dfb31fb410d8dbe73d253cd61409|ps4/sys_modules/libSceFreeTypeOt.sprx
0489870b439ebd8e365c93d0ac8ce48e|ps4/sys_modules/libSceJpegDec.sprx
a9842b07cca16174b8662f7ab9d1c542|ps4/sys_modules/libSceJpegEnc.sprx
5346d05e0e7542f9cd9478736fcb0b97|ps4/sys_modules/libSceJson.sprx
569107bf7a647f48469b20e7fea73ce9|ps4/sys_modules/libSceJson2.sprx
e6db0962fd1d45e3c519c313f9cd42d3|ps4/sys_modules/libSceLibcInternal.sprx
79df75f0d23611eef6b54f4fd4233c82|ps4/sys_modules/libSceNgs2.sprx
dc222e1082d699ab38ae3c287aaa75b5|ps4/sys_modules/libScePngEnc.sprx
0f2619aa588c533c7b8cba5004566e71|ps4/sys_modules/libSceRtc.sprx
bfa06eb80bef5c08ccb2a96687fc515a|ps4/sys_modules/libSceUlt.sprx
4a56d56e2219c5e2b006b66a4263c01c|arcade/isgsm.zip
51f2f43ae2f3508a14d9f56597e2d3ce|3do/panafz10.bin
524473c1a5a03b17e21d86a0408ff827|pc98/sound.rom
526eda1e2a7920c92c88178789d71d84|dreamcast/naomi.zip;naomi/naomi.zip
559dae4ea78eb9d67702c56c1d791e81|dsi/dsi_bios7.bin
562d5ebf9e030a40d6fabfc2f33139fd|odyssey2/o2rom.bin
5904b0de768d1d506e766aa7e18994c1|arcade/midssio.zip
593cff6597ab9380d822b8f824fd2c28|pc98/2608_TOP.WAV
5c2366f25ff92d71788468ca492ebeca|neogeocd/front-sp1.bin
5f8924d013dd57a89cf349f4cdedc6b1|amigacd32/kick40060.CD32
62e761035cb657903761800f4437b8af|intellivision/exec.bin
635a978fd40db9a18ee44eff449fc126|epoch-super-cassette-vision/upd7801g.s01
6418d091cd6907bbcf940324339e43bb|msx/MSXDOS2.ROM
646773759326fbac3b2311fd8c8793ee|amiga/kick40068.A1200
672e104c3be3a238301aceffc3b23fd6|gamegear/bios.gg
6d2cb14fc3e1f65ceb135633d1694122|pcenginecd/gexpress.pce
6d8c0ca64e726c82a4b726e9b01cdf1e|msx2/MSX2P.ROM
6f69cc8b5ed761b03afd78000dfb0e19|msx/FMPAC.ROM;msx2/FMPAC.ROM
709acce6e9c4043b851ea7429b8e7eff|cdimono1/cdibios.zip
72ea51443070f0e9212bfc9b793ee28e|pc98/itf.rom
79ae0d2bb1901b7e606b6dc339b79a97|arcade/ym2608.zip
7c8243c71d8f143b2531f01afa6a05dc|msx2/MSX2PEXT.ROM
7da1e5b7c482d4108d22a5b09631d967|pc98/font.bmp
7f98d77d7a094ad7d069b74bd553ec98|fds/gamegenie.nes
7fd4caabac1d9169e289f0f7bbf71d8e|x68000/iplrom.dat
801c529739b83e1490b897f2d3ffbb3a|cdimono1/cdimono1.zip
80ac46fa7e77b8ab4366e86948e54f83|ps2/ps2-0230j-20080220.bin
80dcd1ad1a4cf65d64b7ba10504e8190|msx/DISK.ROM;msx2/DISK.ROM
82a21c1890cae844b3df741f2762d48d|amiga/kick34005.A500;cdtv/kick34005.A500
840481177270d5642a14ca71ee72844c|mastersystem/bios_E.sms;mastersystem/bios_U.sms
85254fbe320ca82a768ec2c26bb08def|dreamcast/awbios.zip
85ec9ca47d8f6807718151cbcca8b964|saturn/sega_101.bin
8639fd5e549bd6238cfee79e3e749114|3do/goldstar.bin
87b665fce118f76251271c3732532777|dsi/dsi_bios9.bin
87cc944eef4c671aa2629a8ba48a08e0|arcade/pgm.zip
89da1838a24460e4b93f4f0c5d92d48d|cdtv/kick34005.CDTV
8d3d9f294b6e174bc7b1d2fd1c727530|n64dd/64DD_IPL.bin
8dd7d5296a650fac7319bce665a6a53c|psx/scph5500.bin
924e392ed05558ffdb115408c263dccf|psx/scph1001.bin
95d339631d867c8f1d15a5f2ec26069d|channelf/sl90025.bin
96a4ead13f364734f79b0c58af2f0e1f|pc98/2608_TOM.WAV
97aa5f47030cd9fdb679d4fafbb0e332|cdimono1/cdimono2.zip
9bdedde6a4f33555b4a270c8ca53297d|amiga/kick40068.A4000
a392174eb3e572fed6447e956bde4b25|nds/bios9.bin
a3e8d617c95d08031fe1b20d541434b2|atari800/ATARIOSB.ROM
a496cfdded3da562759be3561317b605|3do/panafz1j.bin
a860e8c0b6d573d191e4ec7db1b1e4f6|gba/gba_bios.bin
aa95aea2563cd5ec0a0919b44cc17d47|msx/MSX.ROM
ac9804d4c0e9d07e33472e3726ed15c3|channelf/sl31253.bin
af5828fdff51384f99b3c4926be27762|saturn/saturn_bios.bin
b15ddb15721c657d82c5bab6db982ee9|gb/SGB1.sfc
b7a2a04677d34f069eeb643d5238bf86|atari800/BB01R4_OS.ROM
b7e1189b341bf6a8e270017c096d21b0|arcade/decocass.zip
bb72565701b1b6faece07d68ea5da639|amigacd32/kick40060.CD32.ext
be09394f0576cf81fa8bacf634daf9a2|c64/JiffyDOS_C64.bin
bfacf1a68792d5348f93cf724d2f1dda|arcade/nmk004.zip
c1c57ce48e8ee4135885cee9e63a68a2|atarist/tos.img
c50072cbab75673e1b1a6b94355e6fa8|naomi2/naomi2.zip
c500ff71236068e0dc0d0603d265ae76|videopac/g7400.bin
ca30b50f880eb660a320674ed365ef7a|fds/disksys.rom
cb0a5cfcf7247a7eab74bb2716260269|x68000/cgrom.dat
cc78d4f4900f622bd6de1aed7f52592f|x68000/iplromco.dat
cd237e16e7e77c06bb58540e9e9fca68|pc98/bios.rom
d3a44ba7d42a74d3ac58cb9c14c6a5ca|sufami/STBIOS.bin
d574d4f9c12f305074798f54c091a8b4|gb/sgb_bios.bin
d71004351c8bbfdad53b18222c061d49|pc98/2608_SD.WAV
d7eb37aec6960cba36bc500e0e5d00bc|atari800/XEGAME.ROM
d94546e70f17fd899be8df3544ab6cbb|pc98/2608_BD.WAV
da98f4bb3242ab80d76629021bb27585|channelf/sl31254.bin
db92574caab77a7ec99d4605fd6f2450|gc/IPL.bin
dbfce9db9deaa2567f6a84fde55f9680|gbc/gbc_bios.bin;gbc/cgb_boot.bin
dc10d7bdd1b6f450773dfb558477c230|amiga/kick37175.A500
dc69f0643a3030aaa4797501b483d6c4|ps2/ps2-0230e-20080220.bin
df692a80a5b1bc90728bc3dfc76cd948|nds/bios7.bin
df6f8a3d83c028a5cb9f2f2be60773f3|arcade/cchip.zip
e10c53c2f8b90bab96ead2d368858623|dreamcast/dc_boot.bin
e255264d85d5765013b1b2fa8109dd53|neogeocd/ng-lo.rom
e40a5dfb3d017ba8779faba30cbd1c8e|amiga/kick40063.A600
e45033d9b0fa6b0de071292bba7c9d13|nds/firmware.bin
e66fa1dc5820d254611fdcdba0662372|segacd/bios_CD_E.bin
eb1f32f5d9f382db1bbfb8d7f9cb343a|atari800/ATARIOSA.ROM
ec3a01c91f24fbddcbcab0ad301bc9ef|msx2/MSX2.ROM
eeeea1cd29c6e0e8b094790ae969bfa7|x1/IPLROM.X1
f1071cdb0b6b10dde94d3bc8a6146387|odyssey2/c52.bin
f373003710ab4322642f527f567e020a|x68000/iplrom30.dat
f39572af7584cb5b3f70ae8cc848aba2|neogeocd/neocd.bin
f47264dd47fe30f73ab3c010015c155b|3do/panafz1.bin
f81298afd68a1a24a49a1a2d9f087964|arcade/bubsys.zip
fc7599f3f871578fe9a0453662d1c966|neogeocd/000-lo.lo
fcd403db69f54290b51035d82f835e7b|atarilynx/lynxboot.img
febe8782b466d7c3b16de6d104826b34|msx/KANJI.ROM;msx2/KANJI.ROM
fed4d8242cfbed61343d53d48432aced|satellaview/BS-X.bin
TABLE
while IFS='|' read -r k h; do [ -n "$k" ] && GOOD["$k"]="$h"; done <<'TABLE'
3do/goldstar.bin|8639fd5e549bd6238cfee79e3e749114
3do/panafz1.bin|f47264dd47fe30f73ab3c010015c155b
3do/panafz10.bin|51f2f43ae2f3508a14d9f56597e2d3ce
3do/panafz1j.bin|a496cfdded3da562759be3561317b605
3do/sanyotry.bin|35fa1a1ebaaeea286dc5cd15487c13ea
amiga/kick34005.a500|82a21c1890cae844b3df741f2762d48d
amiga/kick37175.a500|dc10d7bdd1b6f450773dfb558477c230
amiga/kick40063.a600|e40a5dfb3d017ba8779faba30cbd1c8e
amiga/kick40068.a1200|646773759326fbac3b2311fd8c8793ee
amiga/kick40068.a4000|9bdedde6a4f33555b4a270c8ca53297d
amigacd32/kick40060.cd32.ext|bb72565701b1b6faece07d68ea5da639
amigacd32/kick40060.cd32|5f8924d013dd57a89cf349f4cdedc6b1
arcade/bubsys.zip|f81298afd68a1a24a49a1a2d9f087964
arcade/cchip.zip|df6f8a3d83c028a5cb9f2f2be60773f3
arcade/decocass.zip|b7e1189b341bf6a8e270017c096d21b0
arcade/hiscore.dat|37fc4e050b53a1ef2c2e7f3042553025
arcade/isgsm.zip|4a56d56e2219c5e2b006b66a4263c01c
arcade/midssio.zip|5904b0de768d1d506e766aa7e18994c1
arcade/neogeo.zip|00dad01abdbf8ea9e79ad2fe11bdb182
arcade/nmk004.zip|bfacf1a68792d5348f93cf724d2f1dda
arcade/pgm.zip|87cc944eef4c671aa2629a8ba48a08e0
arcade/skns.zip|3f956c4e7008804cb47cbde49bd5b908
arcade/ym2608.zip|79ae0d2bb1901b7e606b6dc339b79a97
atari5200/5200.rom|281f20ea4320404ec820fb7ec0693b38
atari7800/7800 bios (e).rom|397bb566584be7b9764e7a68974c4263
atari7800/7800 bios (u).rom|0763f1ffb006ddbe32e52d497ee848ae
atari800/ataribas.rom|0bac0c6a50104045d902df4503a4c30b
atari800/atariosa.rom|eb1f32f5d9f382db1bbfb8d7f9cb343a
atari800/atariosb.rom|a3e8d617c95d08031fe1b20d541434b2
atari800/atarixl.rom|06daac977823773a3eea3422fd26a703
atari800/bb01r4_os.rom|b7a2a04677d34f069eeb643d5238bf86
atari800/xegame.rom|d7eb37aec6960cba36bc500e0e5d00bc
atarilynx/lynxboot.img|fcd403db69f54290b51035d82f835e7b
atarist/tos.img|c1c57ce48e8ee4135885cee9e63a68a2
c64/jiffydos_1541-ii.bin|1b1e985ea5325a1f46eb7fd9681707bf
c64/jiffydos_c64.bin|be09394f0576cf81fa8bacf634daf9a2
cdimono1/cdibios.zip|709acce6e9c4043b851ea7429b8e7eff
cdimono1/cdimono1.zip|801c529739b83e1490b897f2d3ffbb3a
cdimono1/cdimono2.zip|97aa5f47030cd9fdb679d4fafbb0e332
cdtv/kick34005.a500|82a21c1890cae844b3df741f2762d48d
cdtv/kick34005.cdtv|89da1838a24460e4b93f4f0c5d92d48d
channelf/sl31253.bin|ac9804d4c0e9d07e33472e3726ed15c3
channelf/sl31254.bin|da98f4bb3242ab80d76629021bb27585
channelf/sl90025.bin|95d339631d867c8f1d15a5f2ec26069d
colecovision/colecovision.rom|2c66f5911e5b42b8ebe113403548eee7
dreamcast/awbios.zip|85254fbe320ca82a768ec2c26bb08def
dreamcast/dc_boot.bin|e10c53c2f8b90bab96ead2d368858623
dreamcast/naomi.zip|526eda1e2a7920c92c88178789d71d84
dsi/dsi_bios7.bin|559dae4ea78eb9d67702c56c1d791e81
dsi/dsi_bios9.bin|87b665fce118f76251271c3732532777
epoch-super-cassette-vision/upd7801g.s01|635a978fd40db9a18ee44eff449fc126
fds/disksys.rom|ca30b50f880eb660a320674ed365ef7a
fds/gamegenie.nes|7f98d77d7a094ad7d069b74bd553ec98
gamegear/bios.gg|672e104c3be3a238301aceffc3b23fd6
gb/dmg_boot.bin|32fbbd84168d3482956eb3c5051637f5
gb/gb_bios.bin|32fbbd84168d3482956eb3c5051637f5
gb/sgb1.sfc|b15ddb15721c657d82c5bab6db982ee9
gb/sgb_bios.bin|d574d4f9c12f305074798f54c091a8b4
gba/gba_bios.bin|a860e8c0b6d573d191e4ec7db1b1e4f6
gbc/cgb_boot.bin|dbfce9db9deaa2567f6a84fde55f9680
gbc/gbc_bios.bin|dbfce9db9deaa2567f6a84fde55f9680
gc/ipl.bin|db92574caab77a7ec99d4605fd6f2450
intellivision/exec.bin|62e761035cb657903761800f4437b8af
intellivision/grom.bin|0cd5946c6473e42e8e4c2137785e427f
mastersystem/bios_e.sms|840481177270d5642a14ca71ee72844c
mastersystem/bios_j.sms|24a519c53f67b00640d0048ef7089105
mastersystem/bios_u.sms|840481177270d5642a14ca71ee72844c
msx/disk.rom|80dcd1ad1a4cf65d64b7ba10504e8190
msx/fmpac.rom|6f69cc8b5ed761b03afd78000dfb0e19
msx/kanji.rom|febe8782b466d7c3b16de6d104826b34
msx/msx.rom|aa95aea2563cd5ec0a0919b44cc17d47
msx/msxdos2.rom|6418d091cd6907bbcf940324339e43bb
msx2/disk.rom|80dcd1ad1a4cf65d64b7ba10504e8190
msx2/fmpac.rom|6f69cc8b5ed761b03afd78000dfb0e19
msx2/kanji.rom|febe8782b466d7c3b16de6d104826b34
msx2/msx2.rom|ec3a01c91f24fbddcbcab0ad301bc9ef
msx2/msx2ext.rom|2183c2aff17cf4297bdb496de78c2e8a
msx2/msx2p.rom|6d8c0ca64e726c82a4b726e9b01cdf1e
msx2/msx2pext.rom|7c8243c71d8f143b2531f01afa6a05dc
n64dd/64dd_ipl.bin|8d3d9f294b6e174bc7b1d2fd1c727530
naomi/naomi.zip|526eda1e2a7920c92c88178789d71d84
naomi2/naomi2.zip|c50072cbab75673e1b1a6b94355e6fa8
nds/bios7.bin|df692a80a5b1bc90728bc3dfc76cd948
nds/bios9.bin|a392174eb3e572fed6447e956bde4b25
nds/firmware.bin|e45033d9b0fa6b0de071292bba7c9d13
neogeocd/000-lo.lo|fc7599f3f871578fe9a0453662d1c966
neogeocd/front-sp1.bin|5c2366f25ff92d71788468ca492ebeca
neogeocd/neocd.bin|f39572af7584cb5b3f70ae8cc848aba2
neogeocd/ng-lo.rom|e255264d85d5765013b1b2fa8109dd53
neogeocd/top-sp1.bin|122aee210324c72e8a11116e6ef9c0d0
neogeocd/uni-bioscd.rom|08ca8b2dba6662e8024f9e789711c6fc
odyssey2/c52.bin|f1071cdb0b6b10dde94d3bc8a6146387
odyssey2/jopac.bin|279008e4a0db2dc5f1c048853b033828
odyssey2/o2rom.bin|562d5ebf9e030a40d6fabfc2f33139fd
pc98/2608_bd.wav|d94546e70f17fd899be8df3544ab6cbb
pc98/2608_hh.wav|08c54a0c1f774a5538a848a6665a34b4
pc98/2608_rim.wav|465ea0768b27da404aec45dfc501404b
pc98/2608_sd.wav|d71004351c8bbfdad53b18222c061d49
pc98/2608_tom.wav|96a4ead13f364734f79b0c58af2f0e1f
pc98/2608_top.wav|593cff6597ab9380d822b8f824fd2c28
pc98/bios.rom|cd237e16e7e77c06bb58540e9e9fca68
pc98/font.bmp|7da1e5b7c482d4108d22a5b09631d967
pc98/font.rom|38d32748ae49d1815b0614970849fd40
pc98/itf.rom|72ea51443070f0e9212bfc9b793ee28e
pc98/sound.rom|524473c1a5a03b17e21d86a0408ff827
pcengine/syscard3.pce|38179df8f4ac870017db21ebcbf53114
pcenginecd/gexpress.pce|6d2cb14fc3e1f65ceb135633d1694122
pcenginecd/syscard1.pce|2b7ccb3d86baa18f6402c176f3065082
pcenginecd/syscard2.pce|3cdd6614a918616bfc41c862e889dd79
pcenginecd/syscard3.pce|38179df8f4ac870017db21ebcbf53114
pcfx/pcfx.rom|08e36edbea28a017f79f8d4f7ff9b6d7
pokemini/bios.min|1e4fb124a3a886865acb574f388c803d
ps2/ps2-0230a-20080220.bin|21038400dc633070a78ad53090c53017
ps2/ps2-0230e-20080220.bin|dc69f0643a3030aaa4797501b483d6c4
ps2/ps2-0230j-20080220.bin|80ac46fa7e77b8ab4366e86948e54f83
psx/scph1001.bin|924e392ed05558ffdb115408c263dccf
psx/scph5500.bin|8dd7d5296a650fac7319bce665a6a53c
psx/scph5501.bin|490f666e1afb15b7362b406ed1cea246
psx/scph5502.bin|32736f17079d0b2b7024407c39bd3050
psx/scph7001.bin|1e68c231d0896b7eadcad1d7d8e76129
satellaview/bs-x.bin|fed4d8242cfbed61343d53d48432aced
saturn/mpr-17933.bin|3240872c70984b6cbfda1586cab68dbe
saturn/saturn_bios.bin|af5828fdff51384f99b3c4926be27762
saturn/sega_101.bin|85ec9ca47d8f6807718151cbcca8b964
saturn/stvbios.zip|0e92c1e02862dfeb4cdef7f4414b14a9
segacd/bios_cd_e.bin|e66fa1dc5820d254611fdcdba0662372
segacd/bios_cd_j.bin|278a9397d192149e84e820ac621a8edd
segacd/bios_cd_u.bin|2efd74e3232ff260e371b99f84024f7f
sufami/stbios.bin|d3a44ba7d42a74d3ac58cb9c14c6a5ca
videopac/g7400.bin|c500ff71236068e0dc0d0603d265ae76
x1/iplrom.x1|eeeea1cd29c6e0e8b094790ae969bfa7
x68000/cgrom.dat|cb0a5cfcf7247a7eab74bb2716260269
x68000/iplrom.dat|7fd4caabac1d9169e289f0f7bbf71d8e
x68000/iplrom30.dat|f373003710ab4322642f527f567e020a
x68000/iplromco.dat|cc78d4f4900f622bd6de1aed7f52592f
x68000/iplromxv.dat|0617321daa182c3f3d6f41fd02fb3275
TABLE

HAVE7Z=""; for c in 7z 7zz 7za; do command -v $c >/dev/null && HAVE7Z=$c && break; done
HAVEUNZIP=""; command -v unzip >/dev/null && HAVEUNZIP=1
HAVEUNRAR=""; command -v unrar >/dev/null && HAVEUNRAR=1
TMPS=(); trap 'for d in "${TMPS[@]}"; do rm -rf "$d"; done' EXIT
copied=0; there=0; other=0; failed=0; same=0; byfp=0; ps2=0; packs=0
better=(); unknown=(); fixed=0; vaultok=0; nopack=()
SRC="$SRC0"; WHERE=""   # WHERE: "pack.zip: " while sorting what came out of a pack

show() { echo "$WHERE${1#$SRC/}"; }
put() {  # put <source file> <destination file> [link to: other destination…]
  local from="$1" to="$2"; shift 2
  local have="$to"; [ ! -e "$to" ] && [ -n "${PLAN[$to]:-}" ] && have="${PLAN[$to]}"
  if [ -e "$have" ]; then
    if cmp -s "$from" "$have"; then same=$((same+1)); return; fi
    local key="${to#$B/}"; key="${key,,}"; local g="${GOOD[$key]:-}"
    local hf hv; hf="$(md5sum "$from" | cut -d' ' -f1)"; hv="$(md5sum "$have" | cut -d' ' -f1)"
    if [ -n "$g" ] && [ "$hv" = "$g" ]; then vaultok=$((vaultok+1)); return; fi
    if [ -n "$g" ] && [ "$hf" = "$g" ] && [ "$have" = "$to" ]; then
      if [ $FIX = 1 ] && [ $DRY = 0 ]; then
        local keep="$B/_replaced/${to#$B/}"; mkdir -p "$(dirname "$keep")"
        mv "$to" "$keep" && cp -p "$from" "$to" && fixed=$((fixed+1))
      else better+=("${to#$VAULT/}  <-  $WHERE${from#$SRC/}"); fi
    elif [ "$have" = "$to" ]; then unknown+=("${to#$VAULT/}  vs  $WHERE${from#$SRC/}"); fi
    there=$((there+1)); return
  fi
  if [ $DRY = 1 ]; then echo "copy   $WHERE${from#$SRC/}  ->  ${to#$VAULT/}"; copied=$((copied+1)); PLAN[$to]="$from"
  elif mkdir -p "$(dirname "$to")" && cp -p "$from" "$to"; then copied=$((copied+1))
  else echo "FAILED $WHERE${from#$SRC/}"; failed=$((failed+1)); return; fi
  local x; for x in "$@"; do
    [ -e "$x" ] && continue
    if [ $DRY = 1 ]; then echo "link   ${to#$VAULT/}  ->  ${x#$VAULT/}"
    else mkdir -p "$(dirname "$x")"; ln "$to" "$x" 2>/dev/null || cp -p "$to" "$x"; fi
  done
}

by_md5() {  # by_md5 <file>: put it under its right name if its md5 is a known BIOS; 0 = done
  local f="$1" h fp first x links=()
  h="$(md5sum "$f" | cut -d' ' -f1)"; fp="${MD5[$h]:-}"
  [ -z "$fp" ] && return 1
  IFS=';' read -r -a dests <<< "$fp"; first="$B/${dests[0]}"
  for x in "${dests[@]:1}"; do links+=("$B/$x"); done
  [ $DRY = 1 ] && echo "fingerprint: $WHERE$(basename "$f") is ${dests[*]}"
  put "$f" "$first" "${links[@]}"; byfp=$((byfp+1)); return 0
}

is_pack() { case "${1,,}" in *.zip|*.7z|*.rar) return 0;; esac; return 1; }
PACKS=()

RAPACK=0   # 1 while sorting a pack that is a RetroArch system folder ("system/…", "RetroArch … pack")
skipped=0

# a known name is only trusted inside a pack when its md5 is the right one (packs of other emulators
# have their own bios.rom, font.rom, ipl.bin…), or when the list has no md5 and it sits at the top of the pack
name_ok() {  # name_ok <file> <rel> <system/name>
  local g="${GOOD[${3,,}]:-}"
  [ -z "$WHERE" ] && return 0
  if [ -n "$g" ]; then [ "$(md5sum "$1" | cut -d' ' -f1)" = "$g" ]; return; fi
  case "$2" in */*/*) return 1;; esac; return 0
}
ps2_like() {  # a PS2 BIOS: exactly 4 MB, .bin, and named like one
  local low="${1,,}"
  [ "${low##*.}" = "bin" ] && [ "$(stat -c %s "$1")" = "4194304" ] && [[ "$(basename "$low")${WHERE,,}" =~ scph|ps2|bios ]]
}

handle() {  # handle <file>, with SRC the folder it is in (the source, or an unpacked pack)
  local f="$1" rel name low top lowtop s x links first
  rel="${f#$SRC/}"
  [ $RAPACK = 1 ] && case "${rel,,}" in system/*) rel="${rel#*/}";; esac
  name="$(basename "$rel")"; low="${name,,}"; top="${rel%%/*}"; lowtop="${top,,}"
  [ "$top" = "$rel" ] && top="" && lowtop=""
  # what comes with a pack but isn't for an emulator
  if [ -n "$WHERE" ]; then case "$low" in *.txt|*.nfo|*.url|*.htm|*.html|*.md|*.pdf|*.jpg|*.jpeg|*.png|*.gif|*.diz|*.exe|*.bat|*.lnk|thumbs.db|.ds_store) return ;; esac; fi
  if [ -z "$WHERE" ] || [ $RAPACK = 1 ]; then
    case "${rel,,}" in pcsx2/bios/*) put "$f" "$B/ps2/$name"; return ;; esac
    case "$lowtop" in
      dc)          put "$f" "$B/dreamcast/${rel#*/}"; return ;;
      neocd)       put "$f" "$B/neogeocd/${rel#*/}"; return ;;
      ppsspp)      put "$f" "$B/psp/$rel"; return ;;
      dolphin-emu) put "$f" "$B/gc/$rel" "$B/wii/$rel"; return ;;
    esac
  fi
  # PS4 (shadPS4): system modules and fonts from your own PS4, wherever they come from
  case "${rel,,}" in
    sys_modules/*|*/sys_modules/*) put "$f" "$B/ps4/sys_modules/${rel##*[sS][yY][sS]_[mM][oO][dD][uU][lL][eE][sS]/}"; return ;;
    fonts/font/*|*/fonts/font/*|fonts/font2/*|*/fonts/font2/*) x="${rel,,}"; x="${x##*fonts/}"; put "$f" "$B/ps4/fonts/${rel: -${#x}}"; return ;;
  esac
  case "$low" in *.sprx) put "$f" "$B/ps4/sys_modules/$name"; return ;; esac
  s="${SYS[$low]:-}"; [ "$s" = "_retroarch" ] && s=""
  if [ -n "$s" ]; then
    set -- $s; first="$1"; shift; links=()
    if name_ok "$f" "$rel" "$first/$name"; then
      for x in "$@"; do links+=("$B/$x/$name"); done
      if [ -n "$top" ] && { [ -z "$WHERE" ] || [ $RAPACK = 1 ]; }; then
        put "$f" "$B/_retroarch/$rel" "$B/$first/$name" "${links[@]}"; other=$((other+1))
      else put "$f" "$B/$first/$name" "${links[@]}"; fi
      return
    fi
  fi
  # a pack: unpacked later, when it is in the folder itself or at the top of a pack
  # (zips deeper in a pack are data: MAME samples, artwork, arcade BIOS sets)
  if is_pack "$name" && { [ -z "$WHERE" ] || [ -z "$top" ]; }; then
    by_md5 "$f" || PACKS+=("$f|$WHERE$rel"); return
  fi
  by_md5 "$f" && return
  if ps2_like "$f"; then put "$f" "$B/ps2/$name"; ps2=$((ps2+1)); return; fi
  # the rest: RetroArch's own data, as it is (from your folder, or from a RetroArch pack)
  if [ -z "$WHERE" ] || [ $RAPACK = 1 ]; then put "$f" "$B/_retroarch/$rel"; other=$((other+1)); else skipped=$((skipped+1)); fi
}

# does an unpacked pack hold anything we would use? (then it is sorted; else it is left out)
known_in() {
  local d="$1" f n rel g
  [ $RAPACK = 1 ] && return 0
  while IFS= read -r -d '' f; do
    rel="${f#$d/}"; n="$(basename "$f")"; n="${n,,}"
    case "$rel" in */*) ;; *) is_pack "$n" && return 0;; esac
    if [ -n "${SYS[$n]:-}" ] && [ "${SYS[$n]}" != "_retroarch" ]; then
      g="${GOOD[${SYS[$n]%% *}/$n]:-}"
      if [ -n "$g" ]; then [ "$(md5sum "$f" | cut -d' ' -f1)" = "$g" ] && return 0
      else case "$rel" in */*/*) ;; *) return 0;; esac; fi
    fi
    ps2_like "$f" && return 0
    [ -n "${MD5[$(md5sum "$f" | cut -d' ' -f1)]:-}" ] && return 0
  done < <(find "$d" -type f -size -64M -print0)
  return 1
}
empty=()

sort_dir() { while IFS= read -r -d '' f; do handle "$f"; done < <(find "$SRC" -type f -print0 | sort -z); }

unpack() {  # unpack <pack> <into>
  local p="$1" d="$2"
  case "${p,,}" in
    *.zip) if [ -n "$HAVE7Z" ]; then "$HAVE7Z" x -y -o"$d" "$p" >/dev/null 2>&1; elif [ -n "$HAVEUNZIP" ]; then unzip -qq -o "$p" -d "$d" >/dev/null 2>&1; else return 2; fi ;;
    *.7z)  [ -n "$HAVE7Z" ] || return 2; "$HAVE7Z" x -y -o"$d" "$p" >/dev/null 2>&1 ;;
    *.rar) if [ -n "$HAVEUNRAR" ]; then unrar x -o+ -inul "$p" "$d/" >/dev/null 2>&1; fi
           if [ -z "$(find "$d" -type f -print -quit)" ] && command -v bsdtar >/dev/null; then bsdtar -xf "$p" -C "$d" >/dev/null 2>&1; fi
           if [ -z "$(find "$d" -type f -print -quit)" ] && [ -n "$HAVE7Z" ]; then "$HAVE7Z" x -y -o"$d" "$p" >/dev/null 2>&1; fi ;;
  esac
}

sort_dir
# the packs, and the packs that come out of them (3 levels deep at most)
for level in 1 2 3; do
  [ ${#PACKS[@]} -eq 0 ] && break
  todo=("${PACKS[@]}"); PACKS=()
  for item in "${todo[@]}"; do
    p="${item%%|*}"; label="${item#*|}"
    d="$(mktemp -d)"; TMPS+=("$d")
    unpack "$p" "$d"; r=$?
    if [ $r = 2 ]; then nopack+=("$label"); continue; fi
    if [ -z "$(find "$d" -type f -print -quit)" ]; then nopack+=("$label (could not be unpacked)"); continue; fi
    WHERE="$label: "; RAPACK=0
    # a RetroArch system folder in a pack: its layout is kept (MAME samples, core folders…)
    if [[ "${label,,}" =~ retro\ ?arch|extract_to_sy ]] || [ -d "$d/system" ] || [ -d "$d/System" ]; then RAPACK=1; fi
    # no BIOS in it (a MAME/MESS set, a PC emulator's ROMs…): left alone, so nothing loose ends up in the vault
    if ! known_in "$d"; then empty+=("$label"); WHERE=""; RAPACK=0; continue; fi
    packs=$((packs+1)); SRC="$d"
    sort_dir; RAPACK=0
  done
  SRC="$SRC0"; WHERE=""; RAPACK=0
done

echo
[ $DRY = 1 ] && echo "Test run: nothing was copied. Run it again without --dry to copy."
if [ $DRY = 1 ]; then w="to copy"; else w="copied"; fi
echo "$copied $w, $same already in the vault (the same file), $failed failed."
[ $packs -gt 0 ] && echo "$packs packs unpacked (in a temporary folder, removed again)."
echo "$byfp recognised by their md5 and given the right name; $ps2 PS2 BIOS files by their size."
[ $vaultok -gt 0 ] && echo "$vaultok times the vault already has the right dump and this folder another one: the vault's is kept."
[ $fixed -gt 0 ] && echo "$fixed wrong dumps in the vault replaced by the right one (the old ones are in bios/_replaced/)."
if [ ${#better[@]} -gt 0 ]; then
  echo "${#better[@]} times the vault has a WRONG dump and this folder the right one. Run again with --fix to swap them:"
  printf '  %s\n' "${better[@]}"
fi
if [ ${#unknown[@]} -gt 0 ]; then
  echo "${#unknown[@]} times two different files with one name, neither is a known dump (the vault's is kept):"
  printf '  %s\n' "${unknown[@]}"
fi
if [ ${#empty[@]} -gt 0 ]; then
  echo "${#empty[@]} packs have no BIOS we know, and were left out:"
  printf '  %s\n' "${empty[@]:0:25}"; [ ${#empty[@]} -gt 25 ] && echo "  … and $(( ${#empty[@]} - 25 )) more"
fi
if [ ${#nopack[@]} -gt 0 ]; then
  echo "${#nopack[@]} packs were not unpacked. For .rar: sudo apt install libarchive-tools (or unrar), then run again. Or unpack them with Ark into a folder and run this on that folder:"
  printf '  %s\n' "${nopack[@]}"
fi
[ $skipped -gt 0 ] && echo "$skipped files from packs of other emulators were not used (not a BIOS we know)."
echo "$other of those are not a BIOS of one system: they go to bios/_retroarch/ (RetroArch's own data)."
echo "Then open Emu Vault: the BIOS page checks them, and RetroArch-BIOS is made again."
