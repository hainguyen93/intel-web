-- MySQL dump 10.13  Distrib 5.7.11, for Win32 (AMD64)
--
-- Host: stusql.dcs.shef.ac.uk    Database: team128
-- ------------------------------------------------------
-- Server version	5.5.44-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `Queries`
--

DROP TABLE IF EXISTS `Queries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Queries` (
  `query_id` int(11) NOT NULL AUTO_INCREMENT,
  `created_at` datetime DEFAULT NULL,
  `search_query` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`query_id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Queries_Tweets`
--

DROP TABLE IF EXISTS `Queries_Tweets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Queries_Tweets` (
  `query_id` int(11) NOT NULL DEFAULT '0',
  `tweet_id` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`query_id`,`tweet_id`),
  KEY `tweet_id` (`tweet_id`),
  CONSTRAINT `Queries_Tweets_ibfk_1` FOREIGN KEY (`query_id`) REFERENCES `Queries` (`query_id`),
  CONSTRAINT `Queries_Tweets_ibfk_2` FOREIGN KEY (`tweet_id`) REFERENCES `Tweets` (`tweet_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Tweets`
--

DROP TABLE IF EXISTS `Tweets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Tweets` (
  `tweet_id` int(11) NOT NULL AUTO_INCREMENT,
  `created_at` datetime DEFAULT NULL,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `text` varchar(200) DEFAULT NULL,
  `screen_name` varchar(50) DEFAULT NULL,
  `name` varchar(50) DEFAULT NULL,
  `profile_image_url_https` text,
  PRIMARY KEY (`tweet_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2969 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2016-04-11 23:17:09
