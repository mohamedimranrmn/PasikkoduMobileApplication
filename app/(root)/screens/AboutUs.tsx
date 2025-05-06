import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

const AboutUs = () => {
    return (
        <LinearGradient colors={['#4facfe', '#00f2fe']} style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <Animated.View entering={FadeInDown.duration(800)} style={styles.headerContainer}>
                    <Image
                        source={require('../../../assets/images/Logo.png')}
                        style={styles.logo}
                        resizeMode={'contain'}
                    />
                    <Text style={styles.title}>Welcome to Pasikkodu</Text>
                </Animated.View>

                <Animated.View entering={FadeInUp.duration(1000)} style={styles.section}>
                    <Text style={styles.sectionTitle}>Our Mission</Text>
                    <Text style={styles.sectionText}>
                        We aim to bridge the gap between surplus food and those in need. By connecting
                        restaurants and NGOs, we’re reducing food waste and helping communities thrive.
                    </Text>
                </Animated.View>

                <Animated.View entering={FadeInUp.duration(1200)} style={styles.section}>
                    <Text style={styles.sectionTitle}>Why Pasikkodu?</Text>
                    <Text style={styles.sectionText}>
                        Pasikkodu brings transparency, speed, and heart to food distribution. Every donation
                        counts — every meal matters.
                    </Text>
                </Animated.View>

                <Animated.View entering={FadeInUp.duration(1400)} style={styles.section}>
                    <Text style={styles.sectionTitle}>Meet the Team</Text>
                    <Text style={styles.sectionText}>
                        We're a passionate group of developers, volunteers, and dreamers committed to making a
                        real-world impact through technology and compassion.
                    </Text>
                </Animated.View>

                <Animated.View entering={FadeInUp.duration(1600)} style={styles.footer}>
                    <Text style={styles.footerText}>© 2025 Pasikkodu. All rights reserved.</Text>
                </Animated.View>
            </ScrollView>
        </LinearGradient>
    );
};

export default AboutUs;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scroll: {
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    logo: {
        width: 100,
        height: 100,
        marginBottom: 10,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    section: {
        backgroundColor: '#ffffffcc',
        padding: 20,
        borderRadius: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 8,
        color: '#2c3e50',
    },
    sectionText: {
        fontSize: 16,
        color: '#34495e',
        lineHeight: 22,
    },
    footer: {
        marginTop: 30,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
        color: '#fff',
        opacity: 0.8,
    },
});
