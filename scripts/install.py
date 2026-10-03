"""SPDX-License-Identifier: GPL-3.0-or-later
Install one signed catalog addon through the existing private manager socket.
The operator must already have Docker administration access.
"""
import argparse,hashlib,pathlib,json,re,subprocess,sys

UPLOAD=r'''
import sys,os,pathlib,tempfile,hashlib,json
from grocyste.manager import public_key_from_file,verify_archive
from grocyste.hostutils import file_lock
root=pathlib.Path(os.environ.get('PACKAGES_DIR','/packages'))
data=sys.stdin.buffer.read(64*1024*1024+1)
if len(data)>64*1024*1024:raise RuntimeError('Archive too large')
fd,temp=tempfile.mkstemp(prefix='catalog-verified-',dir=root/'incoming')
try:
 with os.fdopen(fd,'wb') as output:output.write(data);output.flush();os.fsync(output.fileno())
 manifest=verify_archive(pathlib.Path(temp),public_key_from_file(pathlib.Path(os.environ.get('CATALOG_PUBLIC_KEY','/app/trust/catalog.pub'))))
 if manifest['id']!='public-catalog' or manifest['version']!='1.0.0' or manifest['capabilities']!=[]:raise RuntimeError('Unexpected catalog package')
 target=root/'incoming'/'public-catalog-1.0.0.zip'
 with file_lock(root/'.manager.lock'):
  if target.exists():
   if hashlib.sha256(target.read_bytes()).digest()!=hashlib.sha256(data).digest():raise RuntimeError('Different immutable package already present')
  else:
   os.replace(temp,target)
   directory=os.open(root/'incoming',os.O_RDONLY|os.O_DIRECTORY)
   try:os.fsync(directory)
   finally:os.close(directory)
 print(json.dumps({'verified':True,'sha256':hashlib.sha256(data).hexdigest()}))
finally:
 if os.path.exists(temp):os.unlink(temp)
'''
ACTIVATE=r'''
import os,socket,http.client,json
class UnixConnection(http.client.HTTPConnection):
 def connect(self):
  self.sock=socket.socket(socket.AF_UNIX,socket.SOCK_STREAM);self.sock.settimeout(45)
  self.sock.connect(os.environ.get('MANAGER_SOCKET','/run/grocyste/manager.sock'))
connection=UnixConnection('localhost')
connection.request('POST','/v1/install',json.dumps({'addonId':'public-catalog','version':'1.0.0'}),{'Content-Type':'application/json'})
response=connection.getresponse();result=json.loads(response.read(1024*1024));print(json.dumps(result))
if response.status>=400:raise SystemExit(1)
'''

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--manager-container',required=True)
    parser.add_argument('--package',type=pathlib.Path,required=True)
    parser.add_argument('--sha256',required=True)
    args=parser.parse_args()
    if not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_.-]{0,160}',args.manager_container) or not re.fullmatch(r'[a-f0-9]{64}',args.sha256):parser.error('Invalid container or SHA-256')
    if args.package.stat().st_size>64*1024*1024:parser.error('Package too large')
    data=args.package.read_bytes()
    if hashlib.sha256(data).hexdigest()!=args.sha256:parser.error('SHA-256 mismatch')
    inspected=subprocess.run(['docker','inspect',args.manager_container],capture_output=True,check=True,text=True)
    info=json.loads(inspected.stdout)[0]
    if info['Config'].get('User')!='1000:1000' or info['Config'].get('Cmd')!=['python','-m','grocyste.manager']:parser.error('Not the expected unprivileged Grocyste manager')
    for code,stdin in [(UPLOAD,data),(ACTIVATE,None)]:
        result=subprocess.run(['docker','exec','-i',args.manager_container,'python','-c',code],input=stdin,capture_output=True)
        if result.stdout:print(result.stdout.decode('utf-8').strip())
        if result.returncode:
            print('Installation non confirmée : relire le registre et le journal du gestionnaire avant toute nouvelle tentative.',file=sys.stderr)
            raise SystemExit(result.returncode)

if __name__=='__main__':main()
