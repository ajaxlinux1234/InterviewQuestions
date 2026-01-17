echo "开始拉取代码"
git pull
echo "拉取代码完成"

cd /root/apps/InterviewQuestions/nest
echo "开始打包nest"
pnpm build
echo "nest打包结束"

echo "pm2重启nest-backend"
pm2 restart nest-backend
echo "重启nest-backend完成"

cd /root/apps/InterviewQuestions/nest-react
echo "nest-react开始打包"
pnpm build
echo "nest-react打包结束"

rm -rf /var/www/interview-app

echo "开始拷贝文件到服务器目录"
cp -r /root/apps/InterviewQuestions/nest-react/build /var/www/interview-app
echo "拷贝文件到服务器目录完成"