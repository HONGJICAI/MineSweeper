docker run -it --rm -v "${PWD}":/work -w /work openjdk:28-ea-jdk \
  keytool -genkeypair -v \
  -keystore release-keystore.jks \
  -alias caiji-release \
  -keyalg RSA \
  -keysize 2048 \
  -validity 36500 \
  -storetype PKCS12 \
  -dname "CN=CaiJi, O=CaiJi Studio, C=CN"