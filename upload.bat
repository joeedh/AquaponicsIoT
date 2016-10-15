REM bleh! make non-stupid!

set PSCP=c:\dev\putty\pscp
set AQUASERVER=172.16.0.184

echo Zipping files
del ..\aquaponic.tar
tar --no-recursion -cf ../aquaponic.tar .\*.j ./*.js ./*.py ./*.sh ./*.json ./*.txt ./*.md

echo Uploading files
%PSCP% -pw aquaponic ../aquaponic.tar  root@%AQUASERVER%:/node_app_slot/aquaponic.tar
